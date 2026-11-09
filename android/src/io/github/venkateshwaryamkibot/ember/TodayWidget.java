package io.github.venkateshwaryamkibot.ember;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** "Today" widget: progress header + tappable list of today's habits. */
public class TodayWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        Widgets.updateAll(ctx);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager m, int id, Bundle opts) {
        m.updateAppWidget(id, build(ctx, id));
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        super.onReceive(ctx, intent);
        String a = intent.getAction();
        if (Widgets.ACTION_TAP.equals(a)) {
            WidgetData.tap(ctx, intent.getStringExtra(Widgets.EXTRA_ID));
            Widgets.updateAll(ctx);
        } else if (Widgets.ACTION_REFRESH.equals(a)) {
            Widgets.updateAll(ctx);
        }
    }

    static RemoteViews build(Context ctx, int widgetId) {
        JSONObject d = WidgetData.load(ctx);
        boolean light = Widgets.light(d);
        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_today);
        rv.setInt(R.id.root, "setBackgroundResource", Widgets.bg(light));
        Widgets.setTextColors(rv, light, new int[]{R.id.title, R.id.pct}, new int[]{R.id.sub, R.id.empty});

        int[] p = d == null ? new int[]{0, 0, 0, 0} : WidgetData.progress(d);
        int due = p[0], ok = p[1], best = p[2], count = p[3];
        rv.setImageViewBitmap(R.id.ring, Widgets.ring(ctx, 46, due == 0 ? 0f : (float) ok / due, light));
        rv.setTextViewText(R.id.pct, Widgets.pct(due, ok));

        String day = new SimpleDateFormat("EEE, d MMM", Locale.getDefault()).format(new Date());
        rv.setTextViewText(R.id.title, "Today · " + day);
        String sub;
        if (d == null || count == 0) sub = "Open Ember to add a habit";
        else if (due == 0) sub = "Nothing scheduled — rest day";
        else if (ok == due) sub = "Perfect day · every promise kept";
        else sub = ok + " of " + due + " done · " + (due - ok) + " to go";
        rv.setTextViewText(R.id.sub, sub);
        rv.setTextViewText(R.id.streak, best > 0 ? "🔥 " + best : "");

        rv.setRemoteAdapter(R.id.list, Widgets.serviceIntent(ctx, widgetId));
        rv.setEmptyView(R.id.list, R.id.empty);
        rv.setTextViewText(R.id.empty, d == null || count == 0
                ? "Tap to open Ember and light your first habit 🔥"
                : "Nothing scheduled today 🌙\nRest is part of the plan.");
        rv.setPendingIntentTemplate(R.id.list, Widgets.tapTemplate(ctx));
        rv.setOnClickPendingIntent(R.id.header, Widgets.openApp(ctx));
        rv.setOnClickPendingIntent(R.id.empty, Widgets.openApp(ctx));
        return rv;
    }
}
