package io.github.venkateshwaryamkibot.ember;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;

import org.json.JSONObject;

/** Small 2×2 widget: today's progress ring and best active streak. */
public class RingWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        Widgets.updateAll(ctx);
    }

    static RemoteViews build(Context ctx) {
        JSONObject d = WidgetData.load(ctx);
        boolean light = Widgets.light(d);
        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_ring);
        rv.setInt(R.id.root, "setBackgroundResource", Widgets.bg(light));
        Widgets.setTextColors(rv, light, new int[]{R.id.pct}, new int[]{R.id.frac});

        int[] p = d == null ? new int[]{0, 0, 0, 0} : WidgetData.progress(d);
        int due = p[0], ok = p[1], best = p[2];
        rv.setImageViewBitmap(R.id.ring, Widgets.ring(ctx, 86, due == 0 ? 0f : (float) ok / due, light));
        rv.setTextViewText(R.id.pct, Widgets.pct(due, ok));
        rv.setTextViewText(R.id.frac, due == 0 ? "rest day" : ok + "/" + due + " today");
        String streak;
        if (d == null || p[3] == 0) streak = "Tap to start";
        else if (due > 0 && ok == due) streak = "Perfect day 🔥";
        else if (best > 0) streak = "🔥 " + best + "-day streak";
        else streak = "Light the first ember";
        rv.setTextViewText(R.id.streak, streak);
        rv.setOnClickPendingIntent(R.id.root, Widgets.openApp(ctx));
        return rv;
    }
}
