package io.github.venkateshwaryamkibot.ember;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/** Daily habit reminder: fires once a day, only if habits are still open. */
public class ReminderReceiver extends BroadcastReceiver {
    static final String PREFS = "ember";
    private static final String ACTION_FIRE = "io.github.venkateshwaryamkibot.ember.REMIND";
    private static final String CHANNEL = "daily";
    private static final int FLAG_IMMUTABLE = 0x04000000;

    private static final String[] NUDGES = {
        "Even the two-minute version counts. Keep the chain alive.",
        "Never miss twice. A tiny rep tonight protects your streak.",
        "Every check-in is a vote for who you’re becoming.",
        "Small and done beats big and someday.",
    };

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (ACTION_FIRE.equals(intent.getAction())) notifyIfNeeded(ctx);
        schedule(ctx); // reschedule next day, and after boot / app update
    }

    static void schedule(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = pending(ctx);
        am.cancel(pi);
        if (!p.getBoolean("on", false)) return;
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, p.getInt("hour", 20));
        c.set(Calendar.MINUTE, p.getInt("minute", 0));
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        if (c.getTimeInMillis() <= System.currentTimeMillis() + 1000) c.add(Calendar.DAY_OF_YEAR, 1);
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, c.getTimeInMillis(), pi);
    }

    private static PendingIntent pending(Context ctx) {
        Intent i = new Intent(ctx, ReminderReceiver.class).setAction(ACTION_FIRE);
        return PendingIntent.getBroadcast(ctx, 1, i, PendingIntent.FLAG_UPDATE_CURRENT | FLAG_IMMUTABLE);
    }

    private static void notifyIfNeeded(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        int left = today.equals(p.getString("statusDay", "")) ? p.getInt("left", -1) : -1;
        if (left == 0) return; // everything already done today — no need to nag

        String title = left > 0
                ? left + (left == 1 ? " habit" : " habits") + " left today 🔥"
                : "Time to check in on your habits 🔥";
        String text = NUDGES[(int) ((System.currentTimeMillis() / 86400000L) % NUDGES.length)];

        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        Notification.Builder b;
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                Class<?> chCls = Class.forName("android.app.NotificationChannel");
                Object ch = chCls.getConstructor(String.class, CharSequence.class, int.class)
                        .newInstance(CHANNEL, "Daily reminder", 3 /* IMPORTANCE_DEFAULT */);
                NotificationManager.class.getMethod("createNotificationChannel", chCls).invoke(nm, ch);
                b = Notification.Builder.class.getConstructor(Context.class, String.class).newInstance(ctx, CHANNEL);
            } else {
                b = new Notification.Builder(ctx);
            }
        } catch (Exception e) {
            b = new Notification.Builder(ctx);
        }
        Intent open = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent content = PendingIntent.getActivity(ctx, 2, open, PendingIntent.FLAG_UPDATE_CURRENT | FLAG_IMMUTABLE);
        b.setSmallIcon(R.drawable.ic_stat)
                .setColor(0xFFFF7A45)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(content)
                .setAutoCancel(true);
        try { nm.notify(1, b.build()); } catch (SecurityException ignored) { }
    }
}
