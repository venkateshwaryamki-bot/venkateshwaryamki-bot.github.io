package io.github.venkateshwaryamkibot.glide;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Vibrator;
import android.view.HapticFeedbackConstants;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.HttpURLConnection;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Glide for Android: hosts the trackpad web app (bundled in assets/www) full-screen
 * and adds what a browser can't do well: LAN discovery, crisp haptics, keeping the
 * screen awake, camera access for QR pairing, and volume keys as mouse buttons.
 */
public class MainActivity extends Activity {
    private static final int REQ_CAMERA = 21;
    private static final int DISCOVERY_PORT = 8765;
    private static final byte[] PROBE = "GLIDE_DISCOVER".getBytes();

    private WebView web;
    private Vibrator vibrator;
    private PermissionRequest pendingPermission;
    private volatile boolean volumeKeys;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        w.setStatusBarColor(Color.parseColor("#08080D"));
        w.setNavigationBarColor(Color.parseColor("#08080D"));
        vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
        // Open straight into the layout picked last time (no flash of the wrong orientation).
        applyLayout(getSharedPreferences("glide", MODE_PRIVATE).getString("layout", "horizontal"));

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#08080D"));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setHapticFeedbackEnabled(true);
        setContentView(web);
        immersive();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setTextZoom(100);
        s.setSupportZoom(false);
        s.setMediaPlaybackRequiresUserGesture(false);

        web.addJavascriptInterface(new Bridge(), "GlideNative");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                Uri u = Uri.parse(url);
                if ("file".equals(u.getScheme())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() { handlePermission(request); }
                });
            }
        });

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl("file:///android_asset/www/index.html");
    }

    /* ---------------------------------------------------------------- camera for QR pairing */
    private void handlePermission(PermissionRequest request) {
        boolean wantsCamera = false;
        for (String r : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) wantsCamera = true;
        }
        if (!wantsCamera) { request.deny(); return; }
        if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
        } else {
            if (pendingPermission != null) pendingPermission.deny();
            pendingPermission = request;
            requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_CAMERA);
        }
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] results) {
        super.onRequestPermissionsResult(req, perms, results);
        if (req != REQ_CAMERA || pendingPermission == null) return;
        if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
            pendingPermission.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
        } else {
            pendingPermission.deny();
        }
        pendingPermission = null;
    }

    /* ---------------------------------------------------------------- layout / orientation */
    private void applyLayout(String layout) {
        int o;
        if ("vertical".equals(layout)) o = ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT;
        else if ("auto".equals(layout)) o = ActivityInfo.SCREEN_ORIENTATION_FULL_USER;
        else o = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE;
        if (getRequestedOrientation() != o) setRequestedOrientation(o);
    }

    /* ---------------------------------------------------------------- full screen */
    @SuppressWarnings("deprecation")
    private void immersive() {
        web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) immersive();
    }

    /* ---------------------------------------------------------------- lifecycle */
    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        js("window.glideResume && window.glideResume()");
    }

    @Override
    protected void onPause() {
        web.onPause();
        super.onPause();
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.glideBack && window.glideBack()) ? 1 : 0", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String v) {
                if (!"1".equals(v)) MainActivity.super.onBackPressed();
            }
        });
    }

    /* ---------------------------------------------------------------- volume keys = buttons */
    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        int code = e.getKeyCode();
        if (volumeKeys && (code == KeyEvent.KEYCODE_VOLUME_DOWN || code == KeyEvent.KEYCODE_VOLUME_UP)) {
            String btn = code == KeyEvent.KEYCODE_VOLUME_DOWN ? "l" : "r";
            if (e.getAction() == KeyEvent.ACTION_DOWN && e.getRepeatCount() == 0) {
                js("window.glideHardware && window.glideHardware('" + btn + "', true)");
            } else if (e.getAction() == KeyEvent.ACTION_UP) {
                js("window.glideHardware && window.glideHardware('" + btn + "', false)");
            }
            return true;
        }
        return super.dispatchKeyEvent(e);
    }

    private void js(final String code) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() { if (web != null) web.evaluateJavascript(code, null); }
        });
    }

    /* ---------------------------------------------------------------- JS bridge */
    private class Bridge {
        @JavascriptInterface
        public void haptic(final int ms) {
            runOnUiThread(new Runnable() {
                @Override
                @SuppressWarnings("deprecation")
                public void run() {
                    // Short ticks use the system haptic engine (crisp); longer ones vibrate.
                    int flags = HapticFeedbackConstants.FLAG_IGNORE_VIEW_SETTING;
                    if (ms <= 6) web.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK, flags);
                    else if (ms <= 12) web.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY, flags);
                    else if (ms <= 18) web.performHapticFeedback(HapticFeedbackConstants.CONTEXT_CLICK, flags);
                    else if (vibrator != null && vibrator.hasVibrator()) vibrator.vibrate(Math.min(ms, 60));
                    else web.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS, flags);
                }
            });
        }

        @JavascriptInterface
        public void setVolumeKeys(boolean on) { volumeKeys = on; }

        /** Older pages: true = horizontal, false = follow the user. */
        @JavascriptInterface
        public void setLandscape(boolean on) { setOrientation(on ? "horizontal" : "auto"); }

        /** Layout picker: "horizontal" (either way round), "vertical", or "auto". Remembered for next launch. */
        @JavascriptInterface
        public void setOrientation(final String layout) {
            getSharedPreferences("glide", MODE_PRIVATE).edit().putString("layout", layout).apply();
            runOnUiThread(new Runnable() {
                @Override
                public void run() { applyLayout(layout); }
            });
        }

        @JavascriptInterface
        public void discover() {
            new Thread(new Runnable() {
                @Override
                public void run() { runDiscovery(); }
            }, "glide-discovery").start();
        }
    }

    /* ---------------------------------------------------------------- USB cable */
    private void runUsbProbe(int port) {
        String result = "null";
        HttpURLConnection conn = null;
        try {
            // Native request: the key endpoint deliberately has no CORS, so web pages can't read it.
            conn = (HttpURLConnection) new URL("http://127.0.0.1:" + port + "/usb-key").openConnection();
            conn.setConnectTimeout(700);
            conn.setReadTimeout(1500);
            conn.setUseCaches(false);
            if (conn.getResponseCode() == 200) {
                InputStream in = conn.getInputStream();
                ByteArrayOutputStream buf = new ByteArrayOutputStream();
                byte[] b = new byte[1024];
                int n;
                while ((n = in.read(b)) > 0 && buf.size() < 8192) buf.write(b, 0, n);
                JSONObject o = new JSONObject(buf.toString("UTF-8"));
                if (o.has("k")) result = o.toString();
            }
        } catch (Exception ignored) {
        } finally {
            if (conn != null) conn.disconnect();
        }
        js("window.glideUsb && window.glideUsb(" + result + ")");
    }

    /* ---------------------------------------------------------------- LAN discovery */
    private void runDiscovery() {
        JSONArray out = new JSONArray();
        Set<String> seen = new HashSet<>();
        DatagramSocket sock = null;
        try {
            sock = new DatagramSocket();
            sock.setBroadcast(true);
            sock.setSoTimeout(250);
            Set<InetAddress> targets = broadcastAddresses();
            long end = System.currentTimeMillis() + 1500;
            long nextProbe = 0;
            byte[] buf = new byte[2048];
            while (System.currentTimeMillis() < end) {
                if (System.currentTimeMillis() >= nextProbe) {   // probe 3x: UDP can drop packets
                    for (InetAddress a : targets) {
                        try { sock.send(new DatagramPacket(PROBE, PROBE.length, a, DISCOVERY_PORT)); }
                        catch (Exception ignored) { }
                    }
                    nextProbe = System.currentTimeMillis() + 500;
                }
                DatagramPacket pkt = new DatagramPacket(buf, buf.length);
                try { sock.receive(pkt); } catch (SocketTimeoutException t) { continue; }
                try {
                    JSONObject o = new JSONObject(new String(pkt.getData(), 0, pkt.getLength(), "UTF-8"));
                    if (o.optInt("glide") != 1) continue;
                    String host = pkt.getAddress().getHostAddress();
                    String key = o.optString("id") + "@" + host;
                    if (!seen.add(key)) continue;
                    JSONObject d = new JSONObject();
                    d.put("id", o.optString("id"));
                    d.put("name", o.optString("name", host));
                    d.put("os", o.optString("os", ""));
                    d.put("port", o.optInt("port", DISCOVERY_PORT));
                    d.put("host", host);
                    out.put(d);
                } catch (Exception ignored) { }
            }
        } catch (Exception ignored) {
        } finally {
            if (sock != null) sock.close();
        }
        js("window.glideDiscovered && window.glideDiscovered(" + out.toString() + ")");
    }

    private static Set<InetAddress> broadcastAddresses() {
        Set<InetAddress> set = new LinkedHashSet<>();
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                for (InterfaceAddress ia : ni.getInterfaceAddresses()) {
                    if (ia.getBroadcast() != null) set.add(ia.getBroadcast());
                }
            }
        } catch (Exception ignored) { }
        try { set.add(InetAddress.getByName("255.255.255.255")); } catch (Exception ignored) { }
        return set;
    }
}
