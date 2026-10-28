export const NEWS_START=Date.parse("2026-10-28T00:00:00-03:00");
export const NEWS_END=Date.parse("2026-10-31T00:00:00-03:00");
export const NEWS_ID="web-academy-novidades-2026-10-28";
export function newsActive(now=Date.now()){return now>=NEWS_START&&now<NEWS_END}
export function newsDismissKey(userId,popupId=NEWS_ID){return "webacademy.popup.dismissed:"+popupId+":"+(userId||"anon")}
export function safePopupLink(url){const v=String(url||"").trim();if(!v||v.startsWith("//")||v.startsWith("/")||v.includes("\\")||!/^([a-z0-9-]+\.html)(\?[a-z0-9_=&%-]+)?$/i.test(v))return null;return v}
export function popupIsLive(p,now=Date.now()){return p.active&&Date.parse(p.starts_at)<=now&&now<Date.parse(p.ends_at)}
