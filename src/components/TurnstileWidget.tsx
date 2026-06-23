import { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { TURNSTILE_SITE_KEY } from "../config/env";

// Cloudflare Turnstile has no RN SDK. Both the Supabase Auth API (captcha
// protection on sign-in/sign-up) and the /api/inquiry-submit + /api/rfq-submit
// Cloudflare Functions require a verified Turnstile token, so we render the
// real widget in a hidden WebView and bridge the token back over postMessage.
// Same site key the web app uses (core/config.js) — it's a public key.
const HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <style>
    html, body { margin: 0; padding: 0; background: transparent; display: flex; justify-content: center; }
  </style>
</head>
<body>
  <div id="widget"></div>
  <script>
    function post(msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
    function render() {
      if (!window.turnstile) { setTimeout(render, 200); return; }
      turnstile.render("#widget", {
        sitekey: "${TURNSTILE_SITE_KEY}",
        callback: function (token) { post({ type: "token", token: token }); },
        "expired-callback": function () { post({ type: "expired" }); },
        "error-callback": function () { post({ type: "error" }); },
      });
    }
    render();
  </script>
</body>
</html>
`;

export interface TurnstileWidgetHandle {
  reset: () => void;
}

interface Props {
  onToken: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, Props>(({ onToken, onExpire, onError }, ref) => {
  const webviewRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    reset: () => webviewRef.current?.reload(),
  }));

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ html: HTML }}
        style={styles.webview}
        scrollEnabled={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "token") onToken(data.token);
            else if (data.type === "expired") onExpire?.();
            else if (data.type === "error") onError?.();
          } catch {
            // ignore malformed bridge messages
          }
        }}
      />
    </View>
  );
});

export default TurnstileWidget;

const styles = StyleSheet.create({
  container: { height: 70, width: "100%", backgroundColor: "transparent" },
  webview: { backgroundColor: "transparent" },
});
