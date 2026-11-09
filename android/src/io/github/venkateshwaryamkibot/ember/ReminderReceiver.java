package io.github.venkateshwaryamkibot.ember;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

/**
 * All of Ember's notifications:
 *  - per-habit reminders with "Done" / "+1" and "Snooze" buttons
 *  - a morning kickoff listing today's habits
 *  - an evening streak saver (quiet once everything is done)
 * Habit data comes from the snapshot the web app shares with the widgets (WidgetData).
 */
public class ReminderReceiver extends BroadcastReceiver {
    static final String PREFS = "ember";
    private static final String P = "io.github.venkateshwaryamkibot.ember.";
    static final String A_EVENING = P + "REMIND";
    static final String A_MORNING = P + "MORNING";
    static final String A_HABIT = P + "HABIT_REMIND";
    static final String A_DONE = P + "NOTIF_DONE";
    static final String A_SNOOZE = P + "NOTIF_SNOOZE";
    private static final String CH_HABITS = "habits";
    private static final String CH_DAILY = "daily";
    private static final int FLAG_IMMUTABLE = 0x04000000;
    private static final int SNOOZE_MIN = 15;
    private static final Random RND = new Random();

    @Override
    public void onReceive(Context ctx, Intent intent) {
        String a = intent.getAction();
        String id = intent.getStringExtra("id");
        if (A_EVENING.equals(a)) evening(ctx);
        else if (A_MORNING.equals(a)) morning(ctx);
        else if (A_HABIT.equals(a)) habitReminder(ctx, id, false);
        else if (A_DONE.equals(a)) { done(ctx, id); return; }
        else if (A_SNOOZE.equals(a)) { snooze(ctx, id); return; }
        scheduleAll(ctx); // next day, and after boot / app update
    }

    /* ======================= scheduling ======================= */

    static SharedPreferences prefs(Context ctx) { return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    private static PendingIntent alarm(Context ctx, int code, String action, String id) {
        Intent i = new Intent(ctx, ReminderReceiver.class).setAction(action);
        if (id != null) i.putExtra("id", id);
        return PendingIntent.getBroadcast(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | FLAG_IMMUTABLE);
    }

    private static void at(AlarmManager am, PendingIntent pi, int hour, int minute) {
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, hour);
        c.set(Calendar.MINUTE, minute);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        if (c.getTimeInMillis() <= System.currentTimeMillis() + 1000) c.add(Calendar.DAY_OF_YEAR, 1);
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, c.getTimeInMillis(), pi);
    }

    private static int habitCode(String id) { return 1000 + (id.hashCode() & 0x7fff); }
    private static int snoozeCode(String id) { return 40000 + (id.hashCode() & 0x7fff); }
    private static int notifId(String id) { return 100 + (id.hashCode() & 0xffff); }

    /** (Re)schedule every alarm from current settings and the habit snapshot. */
    static synchronized void scheduleAll(Context ctx) {
        SharedPreferences p = prefs(ctx);
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);

        PendingIntent ev = alarm(ctx, 1, A_EVENING, null);
        am.cancel(ev);
        if (p.getBoolean("on", false)) at(am, ev, p.getInt("hour", 20), p.getInt("minute", 30));

        PendingIntent mo = alarm(ctx, 5, A_MORNING, null);
        am.cancel(mo);
        if (p.getBoolean("mOn", false)) at(am, mo, p.getInt("mHour", 7), p.getInt("mMinute", 30));

        Set<String> now = new HashSet<String>();
        JSONObject d = WidgetData.load(ctx);
        JSONArray hs = d == null ? null : d.optJSONArray("habits");
        if (hs != null) {
            for (int i = 0; i < hs.length(); i++) {
                JSONObject h = hs.optJSONObject(i);
                if (h == null) continue;
                int[] hm = parseTime(h.optString("remind"));
                if (hm == null) continue;
                String id = h.optString("id");
                int code = habitCode(id);
                at(am, alarm(ctx, code, A_HABIT, id), hm[0], hm[1]);
                now.add(String.valueOf(code));
            }
        }
        for (String old : p.getString("habitAlarms", "").split(",")) {
            if (old.isEmpty() || now.contains(old)) continue;
            try { am.cancel(alarm(ctx, Integer.parseInt(old), A_HABIT, null)); } catch (Exception ignored) { }
        }
        StringBuilder sb = new StringBuilder();
        for (String c : now) { if (sb.length() > 0) sb.append(','); sb.append(c); }
        p.edit().putString("habitAlarms", sb.toString()).apply();
    }

    /** Called with every snapshot: reschedule only when reminder times actually changed. */
    static void onSnapshot(Context ctx) {
        JSONObject d = WidgetData.load(ctx);
        StringBuilder sig = new StringBuilder();
        JSONArray hs = d == null ? null : d.optJSONArray("habits");
        if (hs != null) for (int i = 0; i < hs.length(); i++) {
            JSONObject h = hs.optJSONObject(i);
            if (h != null && parseTime(h.optString("remind")) != null) sig.append(h.optString("id")).append('@').append(h.optString("remind")).append(';');
        }
        SharedPreferences p = prefs(ctx);
        if (!sig.toString().equals(p.getString("remindSig", null))) {
            p.edit().putString("remindSig", sig.toString()).apply();
            scheduleAll(ctx);
        }
    }

    static int[] parseTime(String t) {
        if (t == null || !t.matches("\\d{1,2}:\\d{2}")) return null;
        String[] s = t.split(":");
        int h = Integer.parseInt(s[0]), m = Integer.parseInt(s[1]);
        return h < 24 && m < 60 ? new int[]{h, m} : null;
    }

    /* ======================= notifications ======================= */

    private static JSONObject find(JSONObject d, String id) {
        JSONArray hs = d == null ? null : d.optJSONArray("habits");
        if (hs == null || id == null) return null;
        for (int i = 0; i < hs.length(); i++) {
            JSONObject h = hs.optJSONObject(i);
            if (h != null && id.equals(h.optString("id"))) return h;
        }
        return null;
    }

    private static boolean open(JSONObject d, JSONObject h) {
        String t = d.optString("date");
        if (!WidgetData.scheduled(h, t) || h.optBoolean("skip") || WidgetData.done(h)) return false;
        return !(WidgetData.weekly(h) && h.optInt("weekDone") >= WidgetData.times(h));
    }

    private static List<JSONObject> openHabits(JSONObject d) {
        List<JSONObject> out = new ArrayList<JSONObject>();
        JSONArray hs = d.optJSONArray("habits");
        if (hs != null) for (int i = 0; i < hs.length(); i++) {
            JSONObject h = hs.optJSONObject(i);
            if (h != null && open(d, h)) out.add(h);
        }
        return out;
    }

    private static String pick(String... options) { return options[RND.nextInt(options.length)]; }
    private static String lower(String s) { return s.isEmpty() ? s : Character.toLowerCase(s.charAt(0)) + s.substring(1); }

    /** Reminder for one habit, with action buttons. */
    static void habitReminder(Context ctx, String id, boolean quiet) {
        JSONObject d = WidgetData.load(ctx);
        JSONObject h = find(d, id);
        if (h == null || !open(d, h)) return;
        String name = h.optString("name");
        int target = WidgetData.target(h), count = h.optInt("count");
        int streak = WidgetData.streak(h);
        String emoji = h.optString("emoji", "✨");

        String title;
        if (count > 0 && target > 1) title = pick("Keep going — " + count + " of " + target + " " + h.optString("unit") + " 💪", lower(name) + ": " + count + "/" + target + " — nearly there! 🚀").trim();
        else if (streak >= 2) title = pick("🔥 Keep your " + streak + "-day " + lower(name) + " streak alive", "Day " + (streak + 1) + " of " + lower(name) + "? Let's go! 🔥", "🔥 " + streak + " days strong — " + lower(name) + " time");
        else title = pick("⏰ " + name + " time!", emoji + " Ready for " + lower(name) + "?", "✨ Small step: " + lower(name), "👋 Hey! Time to " + lower(name));

        String stack = h.optString("stack"), tiny = h.optString("tiny");
        String text;
        if (!stack.isEmpty() && !tiny.isEmpty()) text = "After you " + stack + " — even “" + tiny + "” counts.";
        else if (!tiny.isEmpty()) text = pick("Bad day? “" + tiny + "” still counts. 🙌", "Start tiny: " + tiny + ". That's a win.");
        else if (!stack.isEmpty()) text = "After you " + stack + ", you'll " + lower(name) + ". One tap when it's done ✅";
        else text = pick("One tap when it's done ✅", "You've got this 💪", "Future you says thanks 🙏", "Two minutes is enough to keep the chain going ⛓️");

        Notification.Builder b = builder(ctx, CH_HABITS, "Habit reminders", 4)
                .setSmallIcon(R.drawable.ic_stat)
                .setColor(Widgets.color(h))
                .setLargeIcon(habitBitmap(ctx, h))
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(openApp(ctx))
                .setAutoCancel(true)
                .setOnlyAlertOnce(quiet)
                .addAction(R.drawable.ic_check, target > 1 ? "+1 " + h.optString("unit", "") : "✅ Done", alarm(ctx, 20000 + (id.hashCode() & 0x7fff), A_DONE, id))
                .addAction(R.drawable.ic_alarm, "Snooze " + SNOOZE_MIN + " min", alarm(ctx, 30000 + (id.hashCode() & 0x7fff), A_SNOOZE, id));
        post(ctx, notifId(id), b);
    }

    /** "Done" / "+1" tapped on a notification. */
    private static void done(Context ctx, String id) {
        JSONObject d = WidgetData.load(ctx);
        JSONObject h = find(d, id);
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (h == null) { nm.cancel(notifId(id)); return; }
        if (!WidgetData.done(h)) WidgetData.tap(ctx, id); // same queue the widget uses → the app picks it up
        Widgets.updateAll(ctx);

        d = WidgetData.load(ctx);
        h = find(d, id);
        if (h != null && !WidgetData.done(h)) { habitReminder(ctx, id, true); return; } // count habit, not there yet

        int[] p = WidgetData.progress(d);
        int streak = h == null ? 0 : WidgetData.streak(h);
        String name = h == null ? "Habit" : h.optString("name");
        String title, text;
        if (p[0] > 0 && p[0] == p[1]) {
            title = pick("🎉 Perfect day!", "🏆 Every habit done!", "🎉 Clean sweep!");
            text = "Every promise kept today. That's how identity is built.";
        } else {
            title = pick("✅ " + name + " — done!", "💥 Nailed it: " + lower(name), "🙌 " + name + " ✓");
            text = streak > 1 ? "🔥 " + streak + "-day streak. Keep it burning!"
                    : pick("First step taken. Momentum starts now 🚀", "Small wins add up ✨");
            int left = p[0] - p[1];
            if (left > 0) text += "  " + left + " to go today.";
        }
        Notification.Builder b = builder(ctx, CH_HABITS, "Habit reminders", 4)
                .setSmallIcon(R.drawable.ic_stat)
                .setColor(h == null ? 0xFFFF7A3D : Widgets.color(h))
                .setContentTitle(title)
                .setContentText(text)
                .setContentIntent(openApp(ctx))
                .setAutoCancel(true)
                .setOnlyAlertOnce(true);
        timeout(b, 6000);
        post(ctx, notifId(id), b);
    }

    private static void snooze(Context ctx, String id) {
        ((NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE)).cancel(notifId(id));
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + SNOOZE_MIN * 60000L,
                alarm(ctx, snoozeCode(id), A_HABIT, id));
    }

    /** Morning kickoff: what's on today. */
    private static void morning(Context ctx) {
        JSONObject d = WidgetData.load(ctx);
        if (d == null) return;
        List<JSONObject> open = openHabits(d);
        if (open.isEmpty()) return;
        String who = d.optString("name");
        String title = pick("☀️ Good morning" + (who.isEmpty() ? "" : ", " + who) + "!",
                "🌅 Rise and shine" + (who.isEmpty() ? "" : ", " + who) + "!",
                "☕ New day, fresh start" + (who.isEmpty() ? "" : ", " + who) + "!");
        StringBuilder names = new StringBuilder();
        for (int i = 0; i < open.size() && i < 4; i++) {
            if (i > 0) names.append(" · ");
            JSONObject h = open.get(i);
            names.append(h.optString("emoji", "")).append(' ').append(h.optString("name"));
        }
        if (open.size() > 4) names.append(" +").append(open.size() - 4);
        String text = open.size() + (open.size() == 1 ? " habit" : " habits") + " today: " + names
                + "\n" + pick("Start with the easiest one 🎯", "Momentum beats motivation — one tap to begin 🚀", "Make today count ✨");
        Notification.Builder b = builder(ctx, CH_DAILY, "Daily check-ins", 3)
                .setSmallIcon(R.drawable.ic_stat).setColor(0xFFFF7A3D)
                .setContentTitle(title).setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(openApp(ctx)).setAutoCancel(true);
        post(ctx, 2, b);
    }

    /** Evening streak saver: only when something is still open. */
    private static void evening(Context ctx) {
        JSONObject d = WidgetData.load(ctx);
        if (d == null) return;
        List<JSONObject> open = openHabits(d);
        if (open.isEmpty()) return;
        JSONObject risk = null;
        for (JSONObject h : open) {
            if (WidgetData.weekly(h)) continue;
            if (h.optInt("streakBase") >= 2 && (risk == null || h.optInt("streakBase") > risk.optInt("streakBase"))) risk = h;
        }
        String title, text;
        if (risk != null) {
            int s = risk.optInt("streakBase");
            String n = lower(risk.optString("name"));
            title = pick("🔥 Don't let your " + s + "-day " + n + " streak go out!", "🚨 " + s + "-day " + n + " streak at risk!", "🔥 Save your " + s + "-day " + n + " streak!");
            String tiny = risk.optString("tiny");
            text = tiny.isEmpty() ? "There's still time tonight. One tap keeps it alive." : "Two minutes is enough: " + tiny + " ✅";
        } else {
            int n = open.size();
            title = n + (n == 1 ? " habit" : " habits") + " still open today ⏳";
            text = pick("Never miss twice — even the tiny version counts.", "Small and done beats big and someday ✨", "Every check-in is a vote for who you're becoming 🗳️");
        }
        if (open.size() > 1 || risk == null) {
            StringBuilder names = new StringBuilder();
            for (int i = 0; i < open.size() && i < 4; i++) {
                if (i > 0) names.append(" · ");
                names.append(open.get(i).optString("emoji", "")).append(' ').append(open.get(i).optString("name"));
            }
            text += "\nStill open: " + names;
        }
        Notification.Builder b = builder(ctx, CH_DAILY, "Daily check-ins", 3)
                .setSmallIcon(R.drawable.ic_stat).setColor(0xFFFF7A3D)
                .setContentTitle(title).setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(openApp(ctx)).setAutoCancel(true);
        post(ctx, 1, b);
    }

    /** "Send a test notification" from settings. */
    static void test(Context ctx) {
        JSONObject d = WidgetData.load(ctx);
        if (d != null) {
            List<JSONObject> open = openHabits(d);
            if (!open.isEmpty()) { habitReminder(ctx, open.get(0).optString("id"), false); return; }
        }
        Notification.Builder b = builder(ctx, CH_HABITS, "Habit reminders", 4)
                .setSmallIcon(R.drawable.ic_stat).setColor(0xFFFF7A3D)
                .setContentTitle("🎉 Notifications are working!")
                .setContentText("Everything's done today — nothing to remind you about.")
                .setContentIntent(openApp(ctx)).setAutoCancel(true);
        post(ctx, 3, b);
    }

    /* ======================= helpers ======================= */

    private static PendingIntent openApp(Context ctx) {
        Intent open = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(ctx, 2, open, PendingIntent.FLAG_UPDATE_CURRENT | FLAG_IMMUTABLE);
    }

    @SuppressWarnings("deprecation")
    private static Notification.Builder builder(Context ctx, String channel, String channelName, int importance) {
        if (Build.VERSION.SDK_INT >= 26) {
            try {
                NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
                Class<?> chCls = Class.forName("android.app.NotificationChannel");
                Object ch = chCls.getConstructor(String.class, CharSequence.class, int.class).newInstance(channel, channelName, importance);
                NotificationManager.class.getMethod("createNotificationChannel", chCls).invoke(nm, ch);
                return Notification.Builder.class.getConstructor(Context.class, String.class).newInstance(ctx, channel);
            } catch (Exception ignored) { }
        }
        Notification.Builder b = new Notification.Builder(ctx);
        if (importance >= 4) b.setPriority(Notification.PRIORITY_HIGH).setDefaults(Notification.DEFAULT_ALL);
        return b;
    }

    private static void timeout(Notification.Builder b, long ms) {
        if (Build.VERSION.SDK_INT < 26) return;
        try { Notification.Builder.class.getMethod("setTimeoutAfter", long.class).invoke(b, ms); } catch (Exception ignored) { }
    }

    private static void post(Context ctx, int id, Notification.Builder b) {
        try {
            ((NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE)).notify(id, b.build());
        } catch (SecurityException ignored) { } // notifications not permitted
    }

    /** The habit's icon (or emoji) on a soft tile in its colour. */
    static Bitmap habitBitmap(Context ctx, JSONObject h) {
        int size = Math.round(64 * ctx.getResources().getDisplayMetrics().density);
        size = Math.max(96, Math.min(size, 256));
        Bitmap out = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(out);
        int color = Widgets.color(h);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setColor((color & 0x00FFFFFF) | 0x33000000);
        c.drawRoundRect(new RectF(0, 0, size, size), size * 0.28f, size * 0.28f, p);
        Bitmap icon = Widgets.icon(h.optString("icon"));
        if (icon != null) {
            int pad = Math.round(size * 0.22f);
            c.drawBitmap(icon, null, new Rect(pad, pad, size - pad, size - pad), new Paint(Paint.FILTER_BITMAP_FLAG | Paint.ANTI_ALIAS_FLAG));
        } else {
            Paint t = new Paint(Paint.ANTI_ALIAS_FLAG);
            t.setTextSize(size * 0.5f);
            t.setTextAlign(Paint.Align.CENTER);
            Paint.FontMetrics fm = t.getFontMetrics();
            c.drawText(h.optString("emoji", "✨"), size / 2f, size / 2f - (fm.ascent + fm.descent) / 2f, t);
        }
        return out;
    }
}
