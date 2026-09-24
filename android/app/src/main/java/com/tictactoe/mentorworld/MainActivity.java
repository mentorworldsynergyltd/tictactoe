package com.tictactoe.mentorworld;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Capacitor serves the app's own pages at https://localhost by default
    // (server.androidScheme in capacitor.config.ts). That's normally a good
    // thing — it keeps secure-context web APIs like navigator.clipboard
    // working — but it means the WebView's own mixed-content check blocks
    // any plain ws:// connection opened from JS as "insecure content on an
    // https page," separately from (and not fixed by) the
    // cleartextTrafficPermitted network security config, which only governs
    // Android's native networking layer. LAN play is plain ws://, both when
    // joining a host's IP and when this device is the host talking to its
    // own embedded server over loopback, so that connection needs to be
    // explicitly allowed here.
    WebSettings settings = this.bridge.getWebView().getSettings();
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
  }
}
