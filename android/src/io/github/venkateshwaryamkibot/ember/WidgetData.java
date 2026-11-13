package io.github.venkateshwaryamkibot.ember;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

/**
 * Snapshot of today's habits shared between the web app and the home-screen widgets.
 * The web app pushes a fresh snapshot on every render; widget taps update the snapshot
 * optimistically and queue an action the web app applies the next time it opens.
 * Habit rules here mirror app.js (check(), scheduled(), dayProgress(), streak()).
 */
final class WidgetData {
    private static final String KEY = "widget";
    private static final String ACTS = "widgetActions";

    private WidgetData() { }

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(ReminderReceiver.PREFS, Context.MODE_PRIVATE);
    }

    /* ---------- dates (YYYY-MM-DD, local) ---------- */
    static String today() { return fmt(Calendar.getInstance()); }
    static String fmt(Calendar c) {
        return String.format(Locale.US, "%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }
    static Calendar parse(String k) {
        String[] p = k.split("-");
        Calendar c = Calendar.getInstance();
        c.clear();
        c.set(Integer.parseInt(p[0]), Integer.parseInt(p[1]) - 1, Integer.parseInt(p[2]));
        return c;
    }
    static int dow(String k) { return parse(k).get(Calendar.DAY_OF_WEEK) - 1; } // 0 = Sunday
    static String addDays(String k, int n) { Calendar c = parse(k); c.add(Calendar.DAY_OF_YEAR, n); return fmt(c); }
    static String weekStart(String k, int ws) { return addDays(k, -((dow(k) - ws + 7) % 7)); }

    /* ---------- habit rules ---------- */
    static boolean weekly(JSONObject h) {
        JSONObject f = h.optJSONObject("freq");
        return f != null && "weekly".equals(f.optString("type"));
    }
    static int times(JSONObject h) {
        JSONObject f = h.optJSONObject("freq");
        return f == null ? 3 : Math.max(1, f.optInt("times", 3));
    }
    static int target(JSONObject h) { return Math.max(1, h.optInt("target", 1)); }
    static boolean done(JSONObject h) { return !h.optBoolean("skip") && h.optInt("count") >= target(h); }
    static boolean scheduled(JSONObject h, String k) {
        if (k.compareTo(h.optString("created", k)) < 0) return false;
        JSONObject f = h.optJSONObject("freq");
        if (f != null && "days".equals(f.optString("type"))) {
            JSONArray a = f.optJSONArray("days");
            int d = dow(k);
            if (a != null) for (int i = 0; i < a.length(); i++) if (a.optInt(i) == d) return true;
            return false;
        }
        return true;
    }
    static int weekTotal(JSONObject h) { return h.optInt("weekDone") + (done(h) ? 1 : 0); }
    static boolean satisfied(JSONObject h) { return weekly(h) ? (done(h) || weekTotal(h) >= times(h)) : done(h); }
    static int streak(JSONObject h) { return weekly(h) ? h.optInt("streakBase") : h.optInt("streakBase") + (done(h) ? 1 : 0); }

    /** Advance a stale snapshot to today (the app may not have been opened since). */
    private static boolean roll(JSONObject d) throws JSONException {
        String t = today(), k = d.optString("date", t);
        if (k.compareTo(t) >= 0) return false;
        int ws = d.optInt("weekStart", 1);
        JSONArray hs = d.getJSONArray("habits");
        for (int guard = 0; k.compareTo(t) < 0 && guard < 400; guard++) {
            String next = addDays(k, 1);
            boolean newWeek = !weekStart(next, ws).equals(weekStart(k, ws));
            for (int i = 0; i < hs.length(); i++) {
                JSONObject h = hs.getJSONObject(i);
                boolean dn = done(h);
                if (weekly(h)) {
                    if (dn) h.put("weekDone", h.optInt("weekDone") + 1);
                    if (newWeek) {
                        if (h.optInt("weekDone") < times(h)) h.put("streakBase", 0);
                        h.put("weekDone", 0);
                    }
                } else if (dn) {
                    h.put("streakBase", h.optInt("streakBase") + 1);
                } else if (scheduled(h, k) && !h.optBoolean("skip")) {
                    h.put("streakBase", 0);
                }
                h.put("count", 0);
                h.put("skip", false);
            }
            k = next;
        }
        d.put("date", t);
        return true;
    }

    /* ---------- storage ---------- */
    static synchronized JSONObject load(Context ctx) {
        try {
            String s = prefs(ctx).getString(KEY, null);
            if (s == null) return null;
            JSONObject d = new JSONObject(s);
            if (roll(d)) save(ctx, d);
            return d;
        } catch (Exception e) {
            return null;
        }
    }
    private static void save(Context ctx, JSONObject d) {
        int[] p = progress(d);
        prefs(ctx).edit()
                .putString(KEY, d.toString())
                .putString("statusDay", d.optString("date"))
                .putInt("left", p[0] - p[1])
                .apply();
    }

    /** Habits to show in today's list, in app order. */
    static List<JSONObject> list(JSONObject d) {
        List<JSONObject> out = new ArrayList<JSONObject>();
        JSONArray hs = d.optJSONArray("habits");
        if (hs == null) return out;
        String t = d.optString("date");
        for (int i = 0; i < hs.length(); i++) {
            JSONObject h = hs.optJSONObject(i);
            if (h == null || !scheduled(h, t)) continue;
            if (weekly(h) && !done(h) && h.optInt("weekDone") >= times(h)) continue; // weekly goal already met
            out.add(h);
        }
        return out;
    }

    /** {due, ok, bestStreak, habitCount} — same rules as dayProgress() in app.js. */
    static int[] progress(JSONObject d) {
        int due = 0, ok = 0, best = 0, n = 0;
        JSONArray hs = d.optJSONArray("habits");
        if (hs == null) return new int[]{0, 0, 0, 0};
        String t = d.optString("date");
        for (int i = 0; i < hs.length(); i++) {
            JSONObject h = hs.optJSONObject(i);
            if (h == null) continue;
            n++;
            best = Math.max(best, streak(h));
            if (!scheduled(h, t) || h.optBoolean("skip")) continue;
            due++;
            if (satisfied(h)) ok++;
        }
        return new int[]{due, ok, best, n};
    }

    /** Same toggle rule as check() in app.js. */
    private static void applyTap(JSONObject h) throws JSONException {
        int c = h.optBoolean("skip") ? 0 : h.optInt("count");
        int tg = target(h);
        h.put("skip", false);
        boolean timed = "time".equals(h.optString("goal"));
        h.put("count", c >= tg ? 0 : (timed ? tg : tg > 1 ? c + 1 : 1)); // timed habits complete in one tap
    }
    private static JSONObject find(JSONObject d, String id) {
        JSONArray hs = d.optJSONArray("habits");
        if (hs == null || id == null) return null;
        for (int i = 0; i < hs.length(); i++) {
            JSONObject h = hs.optJSONObject(i);
            if (h != null && id.equals(h.optString("id"))) return h;
        }
        return null;
    }

    /** A habit was tapped on the widget. */
    static synchronized void tap(Context ctx, String id) {
        try {
            JSONObject d = load(ctx);
            if (d == null) return;
            JSONObject h = find(d, id);
            if (h == null) return;
            applyTap(h);
            JSONArray q = new JSONArray(prefs(ctx).getString(ACTS, "[]"));
            q.put(new JSONObject().put("id", id).put("date", d.optString("date")));
            prefs(ctx).edit().putString(ACTS, q.toString()).apply();
            save(ctx, d);
        } catch (Exception ignored) { }
    }

    /** Fresh snapshot from the web app; re-apply taps it hasn't picked up yet. */
    static synchronized void setFromJs(Context ctx, String json) {
        try {
            JSONObject d = new JSONObject(json);
            roll(d);
            JSONArray q = new JSONArray(prefs(ctx).getString(ACTS, "[]"));
            for (int i = 0; i < q.length(); i++) {
                JSONObject a = q.getJSONObject(i);
                if (!a.optString("date").equals(d.optString("date"))) continue;
                JSONObject h = find(d, a.optString("id"));
                if (h != null) applyTap(h);
            }
            save(ctx, d);
        } catch (Exception ignored) { }
    }

    /** Hand queued widget taps to the web app (and clear the queue). */
    static synchronized String takeActions(Context ctx) {
        String s = prefs(ctx).getString(ACTS, "[]");
        prefs(ctx).edit().remove(ACTS).apply();
        return s;
    }
}
