package io.github.venkateshwaryamkibot.ember;

import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/** Supplies the rows of the "Today" widget list. */
public class WidgetService extends RemoteViewsService {

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new Factory(getApplicationContext());
    }

    static class Factory implements RemoteViewsFactory {
        private final Context ctx;
        private final List<JSONObject> items = new ArrayList<JSONObject>();
        private boolean light;
        private final java.util.Map<String, android.graphics.Bitmap> icons = new java.util.HashMap<String, android.graphics.Bitmap>();

        Factory(Context ctx) { this.ctx = ctx; }

        @Override public void onCreate() { }
        @Override public void onDestroy() { items.clear(); }
        @Override public int getCount() { return items.size(); }
        @Override public RemoteViews getLoadingView() { return null; }
        @Override public int getViewTypeCount() { return 1; }
        @Override public boolean hasStableIds() { return true; }

        @Override
        public long getItemId(int pos) {
            return pos < items.size() ? items.get(pos).optString("id").hashCode() : pos;
        }

        @Override
        public void onDataSetChanged() {
            JSONObject d = WidgetData.load(ctx);
            List<JSONObject> next = d == null ? new ArrayList<JSONObject>() : WidgetData.list(d);
            light = Widgets.light(d);
            items.clear();
            items.addAll(next);
        }

        @Override
        public RemoteViews getViewAt(int pos) {
            RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_row);
            if (pos >= items.size()) return rv;
            JSONObject h = items.get(pos);
            int color = Widgets.color(h);
            boolean done = WidgetData.done(h), skip = h.optBoolean("skip");
            int target = WidgetData.target(h), count = h.optInt("count");

            rv.setInt(R.id.row, "setBackgroundResource", light ? R.drawable.row_bg_light : R.drawable.row_bg_dark);
            String png = h.optString("icon");
            android.graphics.Bitmap bmp = null;
            if (!png.isEmpty()) {
                bmp = icons.get(png);
                if (bmp == null && (bmp = Widgets.icon(png)) != null) icons.put(png, bmp);
            }
            if (bmp != null) {
                rv.setImageViewBitmap(R.id.icon, bmp);
                rv.setViewVisibility(R.id.icon, View.VISIBLE);
                rv.setViewVisibility(R.id.emoji, View.GONE);
            } else {
                rv.setViewVisibility(R.id.icon, View.GONE);
                rv.setViewVisibility(R.id.emoji, View.VISIBLE);
                rv.setTextViewText(R.id.emoji, h.optString("emoji", "⭐"));
            }
            rv.setInt(R.id.tile, "setColorFilter", color);
            rv.setInt(R.id.tile, "setImageAlpha", light ? 36 : 40);
            rv.setTextViewText(R.id.name, h.optString("name"));
            rv.setTextColor(R.id.name, done ? Widgets.muted(light) : Widgets.text(light));
            rv.setTextColor(R.id.meta, Widgets.muted(light));
            rv.setTextColor(R.id.cnt, Widgets.text(light));
            rv.setTextViewText(R.id.meta, meta(h, done, skip, target, count));

            rv.setImageViewResource(R.id.circle, done ? R.drawable.circle_fill : R.drawable.circle_outline);
            rv.setInt(R.id.circle, "setColorFilter", done ? color : Widgets.muted(light));
            rv.setInt(R.id.circle, "setImageAlpha", done ? 255 : (skip ? 60 : 90));
            rv.setViewVisibility(R.id.check, done ? View.VISIBLE : View.GONE);
            boolean showCount = !done && !skip && target > 1;
            rv.setViewVisibility(R.id.cnt, showCount ? View.VISIBLE : View.GONE);
            if (showCount) rv.setTextViewText(R.id.cnt, String.valueOf(count));

            rv.setOnClickFillInIntent(R.id.row, new Intent().putExtra(Widgets.EXTRA_ID, h.optString("id")));
            return rv;
        }

        private static String meta(JSONObject h, boolean done, boolean skip, int target, int count) {
            if (skip) return "Rest day";
            StringBuilder s = new StringBuilder();
            int st = WidgetData.streak(h);
            if (st > 0) s.append(st).append(WidgetData.weekly(h) ? "-week streak" : "-day streak");
            String extra;
            if (WidgetData.weekly(h)) extra = WidgetData.weekTotal(h) + " of " + WidgetData.times(h) + " this week";
            else if (target > 1) extra = count + " of " + target + (h.optString("unit").isEmpty() ? "" : " " + h.optString("unit"));
            else if (!done && !h.optString("stack").isEmpty()) extra = "After I " + h.optString("stack");
            else if (!done && !h.optString("tiny").isEmpty() && st == 0) extra = "Tiny: " + h.optString("tiny");
            else extra = done ? "Completed" : "Tap to complete";
            if (s.length() > 0) s.append(" · ");
            return s.append(extra).toString();
        }
    }
}
