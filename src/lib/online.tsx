import { useEffect, useState } from "react";

export function useOnlineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    function goOnline() {
      setOnline(true);
    }
    function goOffline() {
      setOnline(false);
    }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}

export function OfflineNotice({ online }: { online: boolean }) {
  if (online) {
    return null;
  }
  return (
    <p className="offline-banner" role="status">
      当前离线。不能生成新翻译，已保存的单词仍可查看。
    </p>
  );
}
