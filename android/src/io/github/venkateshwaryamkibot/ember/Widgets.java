package io.github.venkateshwaryamkibot.ember;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.SweepGradient;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.util.Calendar;
import java.util.Locale;

/** Shared widget helpers: theming, the gradient progress ring, and refresh scheduling. */
final class Widgets {
    static final String ACTION_TAP = "io.github.venkateshwaryamkibot.ember.WIDGET_TAP";
    static final String ACTION_REFRESH = "io.github.venkateshwaryamkibot.ember.WIDGET_REFRESH";
    static final String EXTRA_ID = "habitId";
    static final int FLAG_IMMUTABLE = 0x04000000;
    static final int FLAG_MUTABLE = 0x02000000;

    static final int TEXT_DARK = 0xFFF3F4F8, MUTED_DARK = 0xFF959BB0;
    static final int TEXT_LIGHT = 0xFF17181E, MUTED_LIGHT = 0xFF696D7C;

    private Widgets() { }

    static boolean light(JSONObject d) { return d != null && "light".equals(d.optString("theme")); }
    static int text(boolean light) { return light ? TEXT_LIGHT : TEXT_DARK; }
    static int muted(boolean light) { return light ? MUTED_LIGHT : MUTED_DARK; }
    static int bg(boolean light) { return light ? R.drawable.widget_bg_light : R.drawable.widget_bg_dark; }

    /** Refresh every Ember widget on the home screen. */
    static void updateAll(Context ctx) {
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        int[] today = m.getAppWidgetIds(new ComponentName(ctx, TodayWidget.class));
        for (int id : today) m.updateAppWidget(id, TodayWidget.build(ctx, id));
        if (today.length > 0) m.notifyAppWidgetViewDataChanged(today, R.id.list);
        int[] ring = m.getAppWidgetIds(new ComponentName(ctx, RingWidget.class));
        for (int id : ring) m.updateAppWidget(id, RingWidget.build(ctx));
        if (today.length + ring.length > 0) scheduleMidnight(ctx);
    }

    static PendingIntent openApp(Context ctx) {
        Intent i = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(ctx, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | FLAG_IMMUTABLE);
    }

    /** Roll widgets over to the new day just after midnight, even if the app stays closed. */
    static void scheduleMidnight(Context ctx) {
        Calendar c = Calendar.getInstance();
        c.add(Calendar.DAY_OF_YEAR, 1);
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 30);
        Intent i = new Intent(ctx, TodayWidget.class).setAction(ACTION_REFRESH);
        PendingIntent pi = PendingIntent.getBroadcast(ctx, 7, i, PendingIntent.FLAG_UPDATE_CURRENT | FLAG_IMMUTABLE);
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        am.set(AlarmManager.RTC, c.getTimeInMillis(), pi);
    }

    /** The app's ember-gradient progress ring, drawn as a bitmap. */
    static Bitmap ring(Context ctx, int dp, float pct, boolean light) {
        int size = Math.round(dp * ctx.getResources().getDisplayMetrics().density);
        size = Math.max(48, Math.min(size, 360));
        Bitmap b = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        float stroke = size * 0.11f, half = stroke / 2f, cx = size / 2f;
        RectF r = new RectF(half, half, size - half, size - half);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(stroke);
        p.setStrokeCap(Paint.Cap.ROUND);
        p.setColor(light ? 0xFFECE7DF : 0xFF262A36);
        c.drawArc(r, 0, 360, false, p);
        if (pct > 0) {
            SweepGradient g = new SweepGradient(cx, cx,
                    new int[]{0xFFFF5E62, 0xFFFF7A45, 0xFFFFB547, 0xFFFFB547},
                    new float[]{0f, 0.45f, 0.95f, 1f});
            Matrix m = new Matrix();
            m.setRotate(-95, cx, cx);
            g.setLocalMatrix(m);
            p.setShader(g);
            c.drawArc(r, -90, 360f * Math.min(1f, pct), false, p);
        }
        return b;
    }

    static String pct(int due, int ok) {
        return due == 0 ? "–" : String.format(Locale.US, "%d%%", Math.round(100f * ok / due));
    }

    static int color(JSONObject h) {
        try { return android.graphics.Color.parseColor(h.optString("color", "#FF7A45")); }
        catch (Exception e) { return 0xFFFF7A45; }
    }

    /** Template so each list row can send a tap broadcast with its habit id. */
    static PendingIntent tapTemplate(Context ctx) {
        Intent i = new Intent(ctx, TodayWidget.class).setAction(ACTION_TAP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? FLAG_MUTABLE : 0);
        return PendingIntent.getBroadcast(ctx, 3, i, flags);
    }

    static Intent serviceIntent(Context ctx, int widgetId) {
        Intent svc = new Intent(ctx, WidgetService.class).putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId);
        svc.setData(Uri.parse(svc.toUri(Intent.URI_INTENT_SCHEME)));
        return svc;
    }

    static void setTextColors(RemoteViews rv, boolean light, int[] textIds, int[] mutedIds) {
        for (int id : textIds) rv.setTextColor(id, text(light));
        for (int id : mutedIds) rv.setTextColor(id, muted(light));
    }
}
