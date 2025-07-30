(function(){"use strict";/*! js-cookie v3.0.5 | MIT */function $(t){for(var e=1;e<arguments.length;e++){var o=arguments[e];for(var w in o)t[w]=o[w]}return t}var it={read:function(t){return t[0]==='"'&&(t=t.slice(1,-1)),t.replace(/(%[\dA-F]{2})+/gi,decodeURIComponent)},write:function(t){return encodeURIComponent(t).replace(/%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,decodeURIComponent)}};function M(t,e){function o(a,u,r){if(!(typeof document>"u")){r=$({},e,r),typeof r.expires=="number"&&(r.expires=new Date(Date.now()+r.expires*864e5)),r.expires&&(r.expires=r.expires.toUTCString()),a=encodeURIComponent(a).replace(/%(2[346B]|5E|60|7C)/g,decodeURIComponent).replace(/[()]/g,escape);var i="";for(var h in r)r[h]&&(i+="; "+h,r[h]!==!0&&(i+="="+r[h].split(";")[0]));return document.cookie=a+"="+t.write(u,a)+i}}function w(a){if(!(typeof document>"u"||arguments.length&&!a)){for(var u=document.cookie?document.cookie.split("; "):[],r={},i=0;i<u.length;i++){var h=u[i].split("="),s=h.slice(1).join("=");try{var n=decodeURIComponent(h[0]);if(r[n]=t.read(s,n),a===n)break}catch{}}return a?r[a]:r}}return Object.create({set:o,get:w,remove:function(a,u){o(a,"",$({},u,{expires:-1}))},withAttributes:function(a){return M(this.converter,$({},this.attributes,a))},withConverter:function(a){return M($({},this.converter,a),this.attributes)}},{attributes:{value:Object.freeze(e)},converter:{value:Object.freeze(t)}})}var S=M(it,{path:"/"});const nt=`
:root {
  --b-100: #F2F3F7;
  --s-700: #37546D;
}

/* helps remove the slider animation */
.woot-widget-holder {
  box-shadow: 0 5px 40px rgba(0, 0, 0, .16);
  opacity: 1;
  will-change: transform, opacity;
  transform: translateY(0);
  overflow: hidden !important;
  position: fixed !important;
  transition: opacity 0.2s linear, transform 0.25s linear;
  z-index: 2147483000 !important;
}

.woot-widget-holder.woot-widget-holder--flat {
  box-shadow: none;
  border-radius: 0;
  border: 1px solid var(--b-100);
}

/* gives CSS to chat box field */
.woot-widget-holder iframe {
  border: 0;
  color-scheme: normal;
  height: 100% !important;
  width: 100% !important;
  max-height: 100vh !important;
}

.woot-widget-holder.has-unread-view {
  border-radius: 0 !important;
  min-height: 80px !important;
  height: auto;
  bottom: 94px;
  box-shadow: none !important;
  border: 0;
}

/* gives css to outer circle that has a beak on it */
.woot-widget-bubble {
  background: #1f93ff;
  border-radius: 100px;
  border-width: 0px;
  bottom: 20px;
  // box-shadow: 0 8px 24px rgba(0, 0, 0, .16) !important;
  cursor: pointer;
  height: 64px;
  padding: 0px;
  position: fixed;
  user-select: none;
  width: 64px;
  z-index: 2147483000 !important;
  border-radius: 50%;
  border-radius: 100% 100% 100% 100% / 100% 100% 0% 100%;
  overflow: hidden;
}

.woot-widget-bubble.woot-widget-bubble--flat {
  border-radius: 0;
}

.woot-widget-holder.woot-widget-holder--flat {
  bottom: 90px;
}

.woot-widget-bubble.woot-widget-bubble--flat {
  height: 56px;
  width: 56px;
}

.woot-widget-bubble.woot-widget-bubble--flat.woot--close::before,
.woot-widget-bubble.woot-widget-bubble--flat.woot--close::after {
  left: 28px;
  top: 16px;
}

/* must be for notification, do confirm before any update to this property */
.woot-widget-bubble.unread-notification::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: #ff4040;
  border-radius: 100%;
  top: 0px;
  right: 0px;
  border: 2px solid #ffffff;
  transition: background 0.2s ease;
}

.woot-widget-bubble.woot-widget--expanded {
  bottom: 24px;
  display: flex;
  height: 48px !important;
  width: auto !important;
  align-items: center;
  border-radius: 24px;
}

.woot-widget-bubble.woot-widget--expanded div {
  align-items: center;
  color: #fff;
  display: flex;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen-Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, sans-serif;
  font-size: 16px;
  font-weight: 500;
  justify-content: center;
  padding-right: 20px;
  width: auto !important;
}

.woot-widget-bubble.woot-widget--expanded.woot-widget-bubble-color--lighter div{
  color: var(--s-700);
}

/* fixes widget to the bottom right corner */
.woot-widget-bubble.woot-elements--left {
  left: 20px;
}

/* fixes widget to the bottom right corner */
.woot-widget-bubble.woot-elements--right {
  right: 20px;
}

.woot-widget-bubble:hover {
  background: #1f93ff;
  // box-shadow: 0 8px 32px rgba(0, 0, 0, .4) !important;
}

.woot-widget-bubble.woot-widget-bubble--flat svg {
  margin: 16px;
}

.woot-widget-bubble.woot-widget--expanded svg {
  height: 30px;
  margin: 14px 6px 12px 16px;
  width: 30px;
  transform: rotate(-1deg) !important;
}

/* change inner white circle i.e. svg from here */
.woot-widget-bubble svg {
  all: revert;
  height: 138px;
  // margin: 13.5px;
  margin-left: 17.85px;
  margin-top: 9.5px;
  width: 138px;
  border-radius: 0%;
  transform: rotate(-5deg) !important;
}

.woot-widget-bubble.woot-widget-bubble-color--lighter path{
  fill: var(--s-700);
}

/* makes the chat box appear close to the widget */
@media only screen and (min-width: 667px) {
  .woot-widget-holder.woot-elements--left {
    left: 20px;
 }
  .woot-widget-holder.woot-elements--right {
    right: 20px;
 }
}

.woot--close:hover {
  opacity: 1;
}

/* gives close icon when widget is opened */
.woot--close::before, .woot--close::after {
  background-color: #fff;
  content: ' ';
  display: inline;
  height: 24px;
  left: 32px;
  position: absolute;
  top: 20px;
  width: 2px;
}

.woot-widget-bubble-color--lighter.woot--close::before, .woot-widget-bubble-color--lighter.woot--close::after {
  background-color: var(--s-700);
}

/* gives an angle to the close icon lines */
.woot--close::before {
  transform: rotate(45deg);
}

/* gives an angle to the close icon lines */
.woot--close::after {
  transform: rotate(-45deg);
}

/* makes widget animation */
.woot--hide {
  bottom: -100vh !important;
  top: unset !important;
  opacity: 0;
  visibility: hidden !important;
  z-index: -1 !important;
}

.woot-widget--without-bubble {
  bottom: 20px !important;
}

/* gives proper animation to the chat box field when opened */
.woot-widget-holder.woot--hide{
  transform: translateY(40px);
}
.woot-widget-bubble.woot--close {
  transform: translateX(0px) scale(1) rotate(0deg);
  transition: transform 300ms ease, opacity 100ms ease, visibility 0ms linear 0ms, bottom 0ms linear 0ms;
  border-radius: 50%;
}
.woot-widget-bubble.woot--close.woot--hide {
  transform: translateX(8px) scale(.75) rotate(45deg);
  transition: transform 300ms ease, opacity 200ms ease, visibility 0ms linear 500ms, bottom 0ms ease 200ms;
}

/* gives the widget proper animation when clicked to either open or close the chat box */
.woot-widget-bubble {
  transform-origin: center;
  will-change: transform, opacity;
  transform: translateX(0) scale(1) rotate(0deg) rotate(5deg);
  transition: transform 300ms ease, opacity 100ms ease, visibility 0ms linear 0ms, bottom 0ms linear 0ms;
}

/* gives the widget proper animation when clicked to either open or close the chat box */
.woot-widget-bubble.woot--hide {
  transform: translateX(8px) scale(.75) rotate(-30deg);
  transition: transform 300ms ease, opacity 200ms ease, visibility 0ms linear 500ms, bottom 0ms ease 200ms;
}

.woot-widget-bubble.woot-widget--expanded {
  transform: translateX(0px);
  transition: transform 300ms ease, opacity 100ms ease, visibility 0ms linear 0ms, bottom 0ms linear 0ms;
}
.woot-widget-bubble.woot-widget--expanded.woot--hide {
  transform: translateX(8px);
  transition: transform 300ms ease, opacity 200ms ease, visibility 0ms linear 500ms, bottom 0ms ease 200ms;
}
.woot-widget-bubble.woot-widget-bubble--flat.woot--close {
  transform: translateX(0px);
  transition: transform 300ms ease, opacity 10ms ease, visibility 0ms linear 0ms, bottom 0ms linear 0ms;
}
.woot-widget-bubble.woot-widget-bubble--flat.woot--close.woot--hide {
  transform: translateX(8px);
  transition: transform 300ms ease, opacity 200ms ease, visibility 0ms linear 500ms, bottom 0ms ease 200ms;
}
.woot-widget-bubble.woot-widget--expanded.woot-widget-bubble--flat {
  transform: translateX(0px);
  transition: transform 300ms ease, opacity 200ms ease, visibility 0ms linear 0ms, bottom 0ms linear 0ms;
}
.woot-widget-bubble.woot-widget--expanded.woot-widget-bubble--flat.woot--hide {
  transform: translateX(8px);
  transition: transform 300ms ease, opacity 200ms ease, visibility 0ms linear 500ms, bottom 0ms ease 200ms;
}

@media only screen and (max-width: 667px) {
  .woot-widget-holder {
    height: 100%;
    right: 0;
    top: 0;
    width: 100%;
 }

 .woot-widget-holder iframe {
    min-height: 100% !important;
  }


 .woot-widget-holder.has-unread-view {
    height: auto;
    right: 0;
    width: auto;
    bottom: 0;
    top: auto;
    max-height: 100vh;
    padding: 0 8px;
  }

  .woot-widget-holder.has-unread-view iframe {
    min-height: unset !important;
  }

 .woot-widget-holder.has-unread-view.woot-elements--left {
    left: 0;
  }

  .woot-widget-bubble.woot--close {
    bottom: 60px;
    opacity: 0;
    visibility: hidden !important;
    z-index: -1 !important;
  }
}

/* helps in showing the chat box area in the UI */
@media only screen and (min-width: 667px) {
  .woot-widget-holder {
    border-radius: 16px;
    bottom: 104px;
    height: calc(90% - 64px - 20px);
    max-height: 640px !important;
    min-height: 250px !important;
    width: 400px !important;
 }
}

.woot-hidden {
  display: none !important;
}
`,rt=`
:root {
  --b-100: #F2F3F7;
  --s-700: #37546D;
}

/* helps remove the slider animation */
.woot-widget-holder {
  box-shadow: 0 5px 40px rgba(0, 0, 0, .16);
  opacity: 1;
  will-change: transform, opacity;
  transform: translateY(0);
  overflow: hidden !important;
  position: fixed !important;
  transition: opacity 0.2s linear, transform 0.25s linear;
  z-index: 2147483000 !important;
}

.woot-widget-holder.woot-widget-holder--flat {
  box-shadow: none;
  border-radius: 0;
  border: 1px solid var(--b-100);
}

/* gives CSS to chat box field */
.woot-widget-holder iframe {
  border: 0;
  height: 100% !important;
  width: 100% !important;
  max-height: 100vh !important;
}

.woot-widget-holder.has-unread-view {
  border-radius: 0 !important;
  min-height: 80px !important;
  height: auto;
  bottom: 94px;
  box-shadow: none !important;
  border: 0;
}

/* gives css to outer circle that has a beak on it */
.woot-widget-bubble {
  background: transparent;
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 64px;
  height: 64px;
  z-index: 2147483000 !important;
  cursor: pointer;
  user-select: none;
  padding: 0;
  border: none;
  overflow: visible;
}

.woot-widget-bubble.woot-widget-bubble--flat {
  border-radius: 0;
}

.woot-widget-holder.woot-widget-holder--flat {
  bottom: 90px;
}

.woot-widget-bubble.woot-widget-bubble--flat {
  height: 56px;
  width: 56px;
}

/* must be for notification, do confirm before any update to this property */
.woot-widget-bubble.unread-notification::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: #ff4040;
  border-radius: 100%;
  top: 0px;
  right: 0px;
  border: 2px solid #ffffff;
  transition: background 0.2s ease;
}

.woot-widget-bubble.woot-widget--expanded {
  bottom: 24px;
  display: flex;
  height: 48px !important;
  width: auto !important;
  align-items: center;
  border-radius: 24px;
}

.woot-widget-bubble.woot-widget--expanded div {
  align-items: center;
  color: #fff;
  display: flex;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen-Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, sans-serif;
  font-size: 16px;
  font-weight: 500;
  justify-content: center;
  padding-right: 20px;
  width: auto !important;
}

// .woot-widget-bubble.woot-widget--expanded.woot-widget-bubble-color--lighter div{
//   color: var(--s-700);
// }

/* fixes widget to the bottom right corner */
.woot-widget-bubble.woot-elements--left {
  left: 20px;
}

/* fixes widget to the bottom right corner */
.woot-widget-bubble.woot-elements--right {
  right: 20px;
}


.woot-widget-bubble.woot-widget-bubble--flat svg {
  margin: 16px;
}

.woot-widget-bubble.woot-widget--expanded svg {
  height: 20px;
  margin: 14px 8px 14px 16px;
  width: 20px;
  transform: rotate(-1deg) !important;
}

.woot-widget-bubble svg {
  position: absolute;
  top: 50%;
  left: 50%;
  // width: 100px;      /* or 64px for exact fit */
  // height: 100px;     /* or 64px for exact fit */

  width: 64px;      /* or 64px for exact fit */
  height: 64px;     /* or 64px for exact fit */
  transform: translate(-50%, -50%);
  transform-origin: center center;
  /* Remove margin-left and margin-top */
}

// .woot-widget-bubble.woot-widget-bubble-color--lighter path{
//   fill: var(--s-700);
// }

/* makes the chat box appear close to the widget */
@media only screen and (min-width: 667px) {
  .woot-widget-holder.woot-elements--left {
    left: 20px;
 }
  .woot-widget-holder.woot-elements--right {
    right: 20px;
 }
}

.woot--close:hover {
  opacity: 1;
}


/* makes widget animation */
.woot--hide {
  bottom: -100vh !important;
  top: unset !important;
  opacity: 0;
  visibility: hidden !important;
  z-index: -1 !important;
}

.woot-widget--without-bubble {
  bottom: 20px !important;
}

/* gives proper animation to the chat box field when opened */
.woot-widget-holder.woot--hide{
  transform: translateY(40px);
}
.woot-widget-bubble.woot--close {
  transform: translateX(0px) scale(1) rotate(0deg);
  transition: transform 300ms ease, opacity 100ms ease, visibility 0ms linear 0ms, bottom 0ms linear 0ms;
}
.woot-widget-bubble.woot--close.woot--hide {
  transform: translateX(8px) scale(.75) rotate(45deg);
  transition: transform 300ms ease, opacity 200ms ease, visibility 0ms linear 500ms, bottom 0ms ease 200ms;
}

/* gives the widget proper animation when clicked to either open or close the chat box */
.woot-widget-bubble {
  transform-origin: center;
  will-change: transform, opacity;
  transform: translateX(0) scale(1) rotate(0deg);
  transition: transform 300ms ease, opacity 100ms ease, visibility 0ms linear 0ms, bottom 0ms linear 0ms;
}

/* gives the widget proper animation when clicked to either open or close the chat box */
.woot-widget-bubble.woot--hide {
  transform: translateX(8px) scale(.75) rotate(-30deg);
  transition: transform 300ms ease, opacity 200ms ease, visibility 0ms linear 500ms, bottom 0ms ease 200ms;
}

.woot-widget-bubble.woot-widget--expanded {
  transform: translateX(0px);
  transition: transform 300ms ease, opacity 100ms ease, visibility 0ms linear 0ms, bottom 0ms linear 0ms;
}
.woot-widget-bubble.woot-widget--expanded.woot--hide {
  transform: translateX(8px);
  transition: transform 300ms ease, opacity 200ms ease, visibility 0ms linear 500ms, bottom 0ms ease 200ms;
}
.woot-widget-bubble.woot-widget-bubble--flat.woot--close {
  transform: translateX(0px);
  transition: transform 300ms ease, opacity 10ms ease, visibility 0ms linear 0ms, bottom 0ms linear 0ms;
}
.woot-widget-bubble.woot-widget-bubble--flat.woot--close.woot--hide {
  transform: translateX(8px);
  transition: transform 300ms ease, opacity 200ms ease, visibility 0ms linear 500ms, bottom 0ms ease 200ms;
}
.woot-widget-bubble.woot-widget--expanded.woot-widget-bubble--flat {
  transform: translateX(0px);
  transition: transform 300ms ease, opacity 200ms ease, visibility 0ms linear 0ms, bottom 0ms linear 0ms;
}
.woot-widget-bubble.woot-widget--expanded.woot-widget-bubble--flat.woot--hide {
  transform: translateX(8px);
  transition: transform 300ms ease, opacity 200ms ease, visibility 0ms linear 500ms, bottom 0ms ease 200ms;
}

@media only screen and (max-width: 667px) {
  .woot-widget-holder {
    height: 100%;
    right: 0;
    top: 0;
    width: 100%;
 }

 .woot-widget-holder iframe {
    min-height: 100% !important;
  }


 .woot-widget-holder.has-unread-view {
    height: auto;
    right: 0;
    width: auto;
    bottom: 0;
    top: auto;
    max-height: 100vh;
    padding: 0 8px;
  }

  .woot-widget-holder.has-unread-view iframe {
    min-height: unset !important;
  }

 .woot-widget-holder.has-unread-view.woot-elements--left {
    left: 0;
  }

  .woot-widget-bubble.woot--close {
    bottom: 60px;
    opacity: 0;
    visibility: hidden !important;
    z-index: -1 !important;
  }
}

/* helps in showing the chat box area in the UI */
@media only screen and (min-width: 667px) {
  .woot-widget-holder {
    border-radius: 16px;
    bottom: 104px;
    height: calc(90% - 64px - 20px);
    max-height: 640px !important;
    min-height: 250px !important;
    width: 400px !important;
 }
}

.woot-hidden {
  display: none !important;
}
`,st=()=>{const t=document.createElement("style");t.innerHTML=window.$chatwoot.type==="expanded_bubble"?`${nt}`:`${rt}`,t.dataset.turboPermanent=!0,document.body.appendChild(t)},T=(t,e)=>{const o=document.getElementById(t),w=e.querySelector(`#${t}`);o&&!w&&e.appendChild(o)},k=t=>{T("cw-bubble-holder",t),T("cw-widget-holder",t),T("cw-widget-styles",t)},v=(t,e)=>{t.classList.add(...e.split(" "))},F=(t,e)=>{t.classList.toggle(e)},_=(t,e)=>{t.classList.remove(...e.split(" "))},W=({referrerURL:t,referrerHost:e})=>{b.events.onLocationChange({referrerURL:t,referrerHost:e})},at=()=>{let t=document.location.href;const e=document.location.host,o={childList:!0,subtree:!0};W({referrerURL:t,referrerHost:e});const w=document.querySelector("body");new MutationObserver(u=>{u.forEach(()=>{t!==document.location.href&&(t=document.location.href,W({referrerURL:t,referrerHost:e}))})}).observe(w,o)},N=["standard","expanded_bubble"],z=["standard","flat"],X=["light","auto","dark"],P=t=>N.includes(t)?t:N[0],L=t=>P(t)===N[1],dt=t=>z.includes(t)?t:z[0],V=t=>t==="flat",q=t=>X.includes(t)?t:X[0],lt="chatwoot:error",wt="chatwoot:postback",ct="chatwoot:ready",ut="chatwoot:opened",bt="chatwoot:closed",ht=({eventName:t,data:e=null})=>{let o;return typeof window.CustomEvent=="function"?o=new CustomEvent(t,{detail:e}):(o=document.createEvent("CustomEvent"),o.initCustomEvent(t,!1,!1,e)),o},E=({eventName:t,data:e})=>{const o=ht({eventName:t,data:e});window.dispatchEvent(o)},gt="M208.85,104.42A104.43,104.43,0,0,0,101.9,0C46.51,1.34,1.34,46.51,0,101.9a104.42,104.42,0,0,0,104.39,107h.27A26.25,26.25,0,0,1,109,209c2.49.31,28.1,3.47,62.78,7.8,1.51.27,2.83.46,3.92.6a3,3,0,0,0,2.25-.25,2.26,2.26,0,0,0,.76-1.42q-1-15.57-1.93-31.16h0a13.07,13.07,0,0,1,1-5,9.6,9.6,0,0,1,1.77-2.58A104.14,104.14,0,0,0,208.85,104.42Z",pt="M208.85,104.42A104.43,104.43,0,0,0,101.9,0C46.51,1.34,1.34,46.51,0,101.9a104.42,104.42,0,0,0,104.39,107h.27A26.25,26.25,0,0,1,109,209c2.49.31,28.1,3.47,62.78,7.8,1.51.27,2.83.46,3.92.6a3,3,0,0,0,2.25-.25,2.26,2.26,0,0,0,.76-1.42q-1-15.57-1.93-31.16h0a13.07,13.07,0,0,1,1-5,9.6,9.6,0,0,1,1.77-2.58A104.14,104.14,0,0,0,208.85,104.42Zm-172,3.48a67.66,67.66,0,1,1,64,64.08A67.67,67.67,0,0,1,36.85,107.9Z",mt="M 27.29 105.93 A 76.66 76.66 0 1 1 180.61 105.93 A 76.66 76.66 0 1 1 27.29 105.93 Z",K=document.getElementsByTagName("body")[0],x=document.createElement("div"),y=document.createElement("div");let C=null;const U=document.createElement("button"),A=document.createElement("button");document.createElement("span");const ft=t=>{if(L(window.$chatwoot.type)){const e=document.getElementById("woot-widget--expanded__text");e.innerText=t}},xt=({className:t,target:e,widgetColor:o})=>{let w=`${t} woot-elements--${window.$chatwoot.position}`;const a=document.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttributeNS(null,"id","woot-widget-bubble-close-icon"),a.setAttributeNS(null,"width","100%"),a.setAttributeNS(null,"height","100%"),a.setAttributeNS(null,"viewBox","0 0 208.85 217.51"),a.setAttribute("preserveAspectRatio","xMidYMid meet"),a.setAttributeNS(null,"fill","none"),a.setAttribute("xmlns","http://www.w3.org/2000/svg"),C=document.createElementNS("http://www.w3.org/2000/svg","path"),C.setAttributeNS(null,"d",gt),C.setAttributeNS(null,"fill",o),a.append(C);const u=48,r=104.43,i=108.76,h=u/2,s=document.createElementNS("http://www.w3.org/2000/svg","line");s.setAttribute("x1",r-h),s.setAttribute("y1",i-h),s.setAttribute("x2",r+h),s.setAttribute("y2",i+h);const n=document.createElementNS("http://www.w3.org/2000/svg","line");return n.setAttribute("x1",r+h),n.setAttribute("y1",i-h),n.setAttribute("x2",r-h),n.setAttribute("y2",i+h),[s,n].forEach(d=>{d.setAttribute("stroke","#fff"),d.setAttribute("stroke-width","6"),d.setAttribute("stroke-linecap","round")}),a.append(s,n),e.insertBefore(a,e.firstChild),e.className=w,e.title="Close chat window",e},vt=({className:t,path:e,target:o,logoColors:w,widgetColor:a})=>{let u=`${t} woot-elements--${window.$chatwoot.position}`;const r=document.createElementNS("http://www.w3.org/2000/svg","svg");if(r.setAttributeNS(null,"id","woot-widget-bubble-icon"),r.setAttributeNS(null,"width","100%"),r.setAttributeNS(null,"height","100%"),L(window.$chatwoot.type)?r.setAttributeNS(null,"viewBox","27.29 29.27 153.32 153.32"):(r.setAttributeNS(null,"viewBox","0 0 208.85 217.51"),r.setAttribute("preserveAspectRatio","xMidYMid meet")),r.setAttributeNS(null,"fill","none"),r.setAttribute("xmlns","http://www.w3.org/2000/svg"),C=document.createElementNS("http://www.w3.org/2000/svg","path"),C.setAttributeNS(null,"d",e),C.setAttributeNS(null,"fill",a),r.appendChild(C),o.appendChild(r),L(window.$chatwoot.type)){const g=document.createElement("div");g.id="woot-widget--expanded__text",g.innerText="",o.appendChild(g),u+=" woot-widget--expanded"}const i=70.18,h=33.77,s=11.97,n=105.93,d=document.createElementNS("http://www.w3.org/2000/svg","circle");d.setAttribute("cx",i),d.setAttribute("cy",n),d.setAttribute("r",s),d.setAttribute("fill",w.dot1),r.appendChild(d);const l=document.createElementNS("http://www.w3.org/2000/svg","circle");l.setAttribute("cx",`${i+h}`),l.setAttribute("cy",n),l.setAttribute("r",s),l.setAttribute("fill",w.dot2),r.appendChild(l);const c=document.createElementNS("http://www.w3.org/2000/svg","circle");return c.setAttribute("cx",`${i+2*h}`),c.setAttribute("cy",n),c.setAttribute("r",s),c.setAttribute("fill",w.dot3),r.appendChild(c),o.className=u,o.title="Open chat window",o},yt=t=>{t&&v(y,"woot-hidden"),v(y,"woot--bubble-holder"),y.id="cw-bubble-holder",y.dataset.turboPermanent=!0,K.appendChild(y)},St=t=>{b.events.onBubbleToggle(t),t?E({eventName:ut}):(E({eventName:bt}),U.focus())},B=(t={})=>{const{toggleValue:e}=t,{isOpen:o}=window.$chatwoot;if(o===e)return;const w=e===void 0?!o:e;window.$chatwoot.isOpen=w,F(U,"woot--hide"),F(A,"woot--hide"),F(x,"woot--hide"),St(w)},Ct=()=>{y.addEventListener("click",B)},Et=()=>{const t=document.querySelector(".woot-widget-holder");v(t,"has-unread-view")},Y=()=>{const t=document.querySelector(".woot-widget-holder");_(t,"has-unread-view")},At=t=>{const e=t.replace("#",""),o=parseInt(e.substr(0,2),16),w=parseInt(e.substr(2,2),16),a=parseInt(e.substr(4,2),16);return(o*299+w*587+a*114)/1e3>225},Bt="SET_USER_ERROR";function _t(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}var j={exports:{}},G={exports:{}};(function(){var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",e={rotl:function(o,w){return o<<w|o>>>32-w},rotr:function(o,w){return o<<32-w|o>>>w},endian:function(o){if(o.constructor==Number)return e.rotl(o,8)&16711935|e.rotl(o,24)&4278255360;for(var w=0;w<o.length;w++)o[w]=e.endian(o[w]);return o},randomBytes:function(o){for(var w=[];o>0;o--)w.push(Math.floor(Math.random()*256));return w},bytesToWords:function(o){for(var w=[],a=0,u=0;a<o.length;a++,u+=8)w[u>>>5]|=o[a]<<24-u%32;return w},wordsToBytes:function(o){for(var w=[],a=0;a<o.length*32;a+=8)w.push(o[a>>>5]>>>24-a%32&255);return w},bytesToHex:function(o){for(var w=[],a=0;a<o.length;a++)w.push((o[a]>>>4).toString(16)),w.push((o[a]&15).toString(16));return w.join("")},hexToBytes:function(o){for(var w=[],a=0;a<o.length;a+=2)w.push(parseInt(o.substr(a,2),16));return w},bytesToBase64:function(o){for(var w=[],a=0;a<o.length;a+=3)for(var u=o[a]<<16|o[a+1]<<8|o[a+2],r=0;r<4;r++)a*8+r*6<=o.length*8?w.push(t.charAt(u>>>6*(3-r)&63)):w.push("=");return w.join("")},base64ToBytes:function(o){o=o.replace(/[^A-Z0-9+\/]/ig,"");for(var w=[],a=0,u=0;a<o.length;u=++a%4)u!=0&&w.push((t.indexOf(o.charAt(a-1))&Math.pow(2,-2*u+8)-1)<<u*2|t.indexOf(o.charAt(a))>>>6-u*2);return w}};G.exports=e})();var $t=G.exports,D={utf8:{stringToBytes:function(t){return D.bin.stringToBytes(unescape(encodeURIComponent(t)))},bytesToString:function(t){return decodeURIComponent(escape(D.bin.bytesToString(t)))}},bin:{stringToBytes:function(t){for(var e=[],o=0;o<t.length;o++)e.push(t.charCodeAt(o)&255);return e},bytesToString:function(t){for(var e=[],o=0;o<t.length;o++)e.push(String.fromCharCode(t[o]));return e.join("")}}},Z=D;/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */var Mt=function(t){return t!=null&&(J(t)||Tt(t)||!!t._isBuffer)};function J(t){return!!t.constructor&&typeof t.constructor.isBuffer=="function"&&t.constructor.isBuffer(t)}function Tt(t){return typeof t.readFloatLE=="function"&&typeof t.slice=="function"&&J(t.slice(0,0))}(function(){var t=$t,e=Z.utf8,o=Mt,w=Z.bin,a=function(u,r){u.constructor==String?r&&r.encoding==="binary"?u=w.stringToBytes(u):u=e.stringToBytes(u):o(u)?u=Array.prototype.slice.call(u,0):!Array.isArray(u)&&u.constructor!==Uint8Array&&(u=u.toString());for(var i=t.bytesToWords(u),h=u.length*8,s=1732584193,n=-271733879,d=-1732584194,l=271733878,c=0;c<i.length;c++)i[c]=(i[c]<<8|i[c]>>>24)&16711935|(i[c]<<24|i[c]>>>8)&4278255360;i[h>>>5]|=128<<h%32,i[(h+64>>>9<<4)+14]=h;for(var g=a._ff,p=a._gg,m=a._hh,f=a._ii,c=0;c<i.length;c+=16){var Kt=s,Yt=n,jt=d,Gt=l;s=g(s,n,d,l,i[c+0],7,-680876936),l=g(l,s,n,d,i[c+1],12,-389564586),d=g(d,l,s,n,i[c+2],17,606105819),n=g(n,d,l,s,i[c+3],22,-1044525330),s=g(s,n,d,l,i[c+4],7,-176418897),l=g(l,s,n,d,i[c+5],12,1200080426),d=g(d,l,s,n,i[c+6],17,-1473231341),n=g(n,d,l,s,i[c+7],22,-45705983),s=g(s,n,d,l,i[c+8],7,1770035416),l=g(l,s,n,d,i[c+9],12,-1958414417),d=g(d,l,s,n,i[c+10],17,-42063),n=g(n,d,l,s,i[c+11],22,-1990404162),s=g(s,n,d,l,i[c+12],7,1804603682),l=g(l,s,n,d,i[c+13],12,-40341101),d=g(d,l,s,n,i[c+14],17,-1502002290),n=g(n,d,l,s,i[c+15],22,1236535329),s=p(s,n,d,l,i[c+1],5,-165796510),l=p(l,s,n,d,i[c+6],9,-1069501632),d=p(d,l,s,n,i[c+11],14,643717713),n=p(n,d,l,s,i[c+0],20,-373897302),s=p(s,n,d,l,i[c+5],5,-701558691),l=p(l,s,n,d,i[c+10],9,38016083),d=p(d,l,s,n,i[c+15],14,-660478335),n=p(n,d,l,s,i[c+4],20,-405537848),s=p(s,n,d,l,i[c+9],5,568446438),l=p(l,s,n,d,i[c+14],9,-1019803690),d=p(d,l,s,n,i[c+3],14,-187363961),n=p(n,d,l,s,i[c+8],20,1163531501),s=p(s,n,d,l,i[c+13],5,-1444681467),l=p(l,s,n,d,i[c+2],9,-51403784),d=p(d,l,s,n,i[c+7],14,1735328473),n=p(n,d,l,s,i[c+12],20,-1926607734),s=m(s,n,d,l,i[c+5],4,-378558),l=m(l,s,n,d,i[c+8],11,-2022574463),d=m(d,l,s,n,i[c+11],16,1839030562),n=m(n,d,l,s,i[c+14],23,-35309556),s=m(s,n,d,l,i[c+1],4,-1530992060),l=m(l,s,n,d,i[c+4],11,1272893353),d=m(d,l,s,n,i[c+7],16,-155497632),n=m(n,d,l,s,i[c+10],23,-1094730640),s=m(s,n,d,l,i[c+13],4,681279174),l=m(l,s,n,d,i[c+0],11,-358537222),d=m(d,l,s,n,i[c+3],16,-722521979),n=m(n,d,l,s,i[c+6],23,76029189),s=m(s,n,d,l,i[c+9],4,-640364487),l=m(l,s,n,d,i[c+12],11,-421815835),d=m(d,l,s,n,i[c+15],16,530742520),n=m(n,d,l,s,i[c+2],23,-995338651),s=f(s,n,d,l,i[c+0],6,-198630844),l=f(l,s,n,d,i[c+7],10,1126891415),d=f(d,l,s,n,i[c+14],15,-1416354905),n=f(n,d,l,s,i[c+5],21,-57434055),s=f(s,n,d,l,i[c+12],6,1700485571),l=f(l,s,n,d,i[c+3],10,-1894986606),d=f(d,l,s,n,i[c+10],15,-1051523),n=f(n,d,l,s,i[c+1],21,-2054922799),s=f(s,n,d,l,i[c+8],6,1873313359),l=f(l,s,n,d,i[c+15],10,-30611744),d=f(d,l,s,n,i[c+6],15,-1560198380),n=f(n,d,l,s,i[c+13],21,1309151649),s=f(s,n,d,l,i[c+4],6,-145523070),l=f(l,s,n,d,i[c+11],10,-1120210379),d=f(d,l,s,n,i[c+2],15,718787259),n=f(n,d,l,s,i[c+9],21,-343485551),s=s+Kt>>>0,n=n+Yt>>>0,d=d+jt>>>0,l=l+Gt>>>0}return t.endian([s,n,d,l])};a._ff=function(u,r,i,h,s,n,d){var l=u+(r&i|~r&h)+(s>>>0)+d;return(l<<n|l>>>32-n)+r},a._gg=function(u,r,i,h,s,n,d){var l=u+(r&h|i&~h)+(s>>>0)+d;return(l<<n|l>>>32-n)+r},a._hh=function(u,r,i,h,s,n,d){var l=u+(r^i^h)+(s>>>0)+d;return(l<<n|l>>>32-n)+r},a._ii=function(u,r,i,h,s,n,d){var l=u+(i^(r|~h))+(s>>>0)+d;return(l<<n|l>>>32-n)+r},a._blocksize=16,a._digestsize=16,j.exports=function(u,r){if(u==null)throw new Error("Illegal argument "+u);var i=t.wordsToBytes(a(u,r));return r&&r.asBytes?i:r&&r.asString?w.bytesToString(i):t.bytesToHex(i)}})();var kt=j.exports;const Ft=_t(kt),Q=["avatar_url","email","name"],Nt=[...Q,"identifier_hash"],I=()=>{const t="cw_user_",{websiteToken:e}=window.$chatwoot;return`${t}${e}`},Lt=({identifier:t="",user:e})=>`${Nt.reduce((w,a)=>`${w}${a}${e[a]||""}`,"")}identifier${t}`,Ut=(...t)=>Ft(Lt(...t)),Dt=t=>Q.reduce((e,o)=>e||!!t[o],!1),O=(t,e,{expires:o=365,baseDomain:w=void 0}={})=>{const a={expires:o,sameSite:"Lax",domain:w};typeof e=="object"&&(e=JSON.stringify(e)),S.set(t,e,a)},R=["click","touchstart","keypress","keydown"],It=()=>{let t;try{t=new(window.AudioContext||window.webkitAudioContext)}catch{}return t},tt=async(t="",e)=>{const o=It(),w=(a,u,r)=>{window[r]=()=>{if(o){const i=o.createBufferSource();return i.buffer=a,i.connect(o.destination),i.loop=u,i}return null}};if(o){const{type:a="dashboard",alertTone:u="ding",loop:r=!1}=e||{},i=`${t}/audio/${a}/${u}.mp3`,h=new Request(i),s=await(await fetch(h)).arrayBuffer(),n=await o.decodeAudioData(s);w(n,r,u)}},Ot=({origin:t,conversationCookie:e,websiteToken:o,locale:w})=>{const a=new URL("/widget",t);return a.searchParams.append("cw_conversation",e),a.searchParams.append("website_token",o),a.searchParams.append("locale",w),a.toString()},Rt=(t,e,o,w)=>{try{const a=Ot({origin:t,websiteToken:e,locale:o,conversationCookie:w});window.open(a,`webwidget_session_${e}`,"resizable=off,width=400,height=600").focus()}catch{}};function et(t){if(t===null||t===!0||t===!1)return NaN;var e=Number(t);return isNaN(e)?e:e<0?Math.ceil(e):Math.floor(e)}function H(t,e){if(e.length<t)throw new TypeError(t+" argument"+(t>1?"s":"")+" required, but only "+e.length+" present")}function Ht(t){H(1,arguments);var e=Object.prototype.toString.call(t);return t instanceof Date||typeof t=="object"&&e==="[object Date]"?new Date(t.getTime()):typeof t=="number"||e==="[object Number]"?new Date(t):((typeof t=="string"||e==="[object String]")&&typeof console<"u"&&(console.warn("Starting with v2.0.0-beta.1 date-fns doesn't accept strings as date arguments. Please use `parseISO` to parse strings. See: https://git.io/fjule"),console.warn(new Error().stack)),new Date(NaN))}function Wt(t,e){H(2,arguments);var o=Ht(t).getTime(),w=et(e);return new Date(o+w)}var zt=36e5;function Xt(t,e){H(2,arguments);var o=et(e);return Wt(t,o*zt)}const ot=(t,e="")=>O("cw_conversation",t,{baseDomain:e}),Pt=t=>{const e=Xt(new Date,1);O("cw_snooze_campaigns_till",Number(e),{expires:e,baseDomain:t})},b={getUrl({baseUrl:t,websiteToken:e}){return`${t}/widget?website_token=${e}`},createFrame:({baseUrl:t,websiteToken:e})=>{if(b.getAppFrame())return;st();const o=document.createElement("iframe"),w=S.get("cw_conversation");let a=b.getUrl({baseUrl:t,websiteToken:e});w&&(a=`${a}&cw_conversation=${w}`),o.src=a,o.allow="camera;microphone;fullscreen;display-capture;picture-in-picture;clipboard-write;",o.id="chatwoot_live_chat_widget",o.style.visibility="hidden";let u=`woot-widget-holder woot--hide woot-elements--${window.$chatwoot.position}`;window.$chatwoot.hideMessageBubble&&(u+=" woot-widget--without-bubble"),V(window.$chatwoot.widgetStyle)&&(u+=" woot-widget-holder--flat"),v(x,u),x.id="cw-widget-holder",x.dataset.turboPermanent=!0,x.appendChild(o),K.appendChild(x),b.initPostMessageCommunication(),b.initWindowSizeListener(),b.preventDefaultScroll()},getAppFrame:()=>document.getElementById("chatwoot_live_chat_widget"),getBubbleHolder:()=>document.getElementsByClassName("woot--bubble-holder"),sendMessage:(t,e)=>{b.getAppFrame().contentWindow.postMessage(`chatwoot-widget:${JSON.stringify({event:t,...e})}`,"*")},initPostMessageCommunication:()=>{window.onmessage=t=>{if(typeof t.data!="string"||t.data.indexOf("chatwoot-widget:")!==0)return;const e=JSON.parse(t.data.replace("chatwoot-widget:",""));typeof b.events[e.event]=="function"&&b.events[e.event](e)}},initWindowSizeListener:()=>{window.addEventListener("resize",()=>b.toggleCloseButton())},preventDefaultScroll:()=>{x.addEventListener("wheel",t=>{const e=t.deltaY,o=x.scrollHeight,w=x.offsetHeight,a=x.scrollTop;(a===0&&e<0||w+a===o&&e>0)&&t.preventDefault()})},setFrameHeightToFitContent:(t,e)=>{const o=b.getAppFrame(),w=e?`${t}px`:"100%";o&&o.setAttribute("style",`height: ${w} !important`)},setupAudioListeners:t=>{const{baseUrl:e=""}=window.$chatwoot;tt(e,{type:"widget",alertTone:"ding",loop:!1}).then(()=>R.forEach(o=>{document.removeEventListener(o,b.setupAudioListeners,!1)})),tt(e,{type:"widget",alertTone:"ringtone",loop:!0}).then(()=>R.forEach(o=>{document.removeEventListener(o,b.setupAudioListeners,!1)}))},events:{loaded:t=>{ot(t.config.authToken,window.$chatwoot.baseDomain),window.$chatwoot.hasLoaded=!0;const e=S.get("cw_snooze_campaigns_till");b.sendMessage("config-set",{locale:window.$chatwoot.locale,position:window.$chatwoot.position,hideMessageBubble:window.$chatwoot.hideMessageBubble,showPopoutButton:window.$chatwoot.showPopoutButton,widgetStyle:window.$chatwoot.widgetStyle,darkMode:window.$chatwoot.darkMode,showUnreadMessagesDialog:window.$chatwoot.showUnreadMessagesDialog,campaignsSnoozedTill:e}),b.onLoad({widgetColor:t.config.channelConfig.widgetColor,logoColors:t.config.channelConfig.logoColors}),b.toggleCloseButton(),window.$chatwoot.user&&b.sendMessage("set-user",window.$chatwoot.user),window.playAudioAlert=()=>{},R.forEach(o=>{document.addEventListener(o,b.setupAudioListeners,!1)}),window.$chatwoot.resetTriggered||E({eventName:ct})},error:({errorType:t,data:e})=>{E({eventName:lt,data:e}),t===Bt&&S.remove(I())},onEvent({eventIdentifier:t,data:e}){E({eventName:t,data:e})},setBubbleLabel(t){ft(window.$chatwoot.launcherTitle||t.label)},setAuthCookie({data:{widgetAuthToken:t}}){ot(t,window.$chatwoot.baseDomain)},setCampaignReadOn(){Pt(window.$chatwoot.baseDomain)},openBubble:()=>{let t={};t.toggleValue=!0,B(t)},postback(t){E({eventName:wt,data:t})},toggleBubble:t=>{let e={};t==="open"?e.toggleValue=!0:t==="close"&&(e.toggleValue=!1),B(e)},popoutChatWindow:({baseUrl:t,websiteToken:e,locale:o})=>{const w=S.get("cw_conversation");window.$chatwoot.toggle("close"),Rt(t,e,o,w)},closeWindow:()=>{B({toggleValue:!1}),Y()},onBubbleToggle:t=>{b.sendMessage("toggle-open",{isOpen:t}),t&&b.pushEvent("webwidget.triggered")},onLocationChange:({referrerURL:t,referrerHost:e})=>{b.sendMessage("change-url",{referrerURL:t,referrerHost:e})},updateIframeHeight:t=>{const{extraHeight:e=0,isFixedHeight:o}=t;b.setFrameHeightToFitContent(e,o)},setUnreadMode:()=>{Et(),B({toggleValue:!0})},resetUnreadMode:()=>Y(),handleNotificationDot:t=>{if(window.$chatwoot.hideMessageBubble)return;const e=document.querySelector(".woot-widget-bubble");t.unreadMessageCount>0&&!e.classList.contains("unread-notification")?v(e,"unread-notification"):t.unreadMessageCount===0&&_(e,"unread-notification")},handleCallNotificationDot:t=>{if(window.$chatwoot.hideMessageBubble)return;const e=document.querySelector(".woot-widget-bubble");t.value&&!e.classList.contains("unread-notification")?v(e,"unread-notification"):t.value||_(e,"unread-notification")},closeChat:()=>{B({toggleValue:!1})},playAudio:()=>{window.ding&&window.ding().start()},playRingtone:()=>{window.ringtone&&(window.ringtoneSource=window.ringtone(),window.ringtoneSource.start())},stopRingtone:()=>{window.ringtoneSource&&(window.ringtoneSource.stop(0),window.ringtoneSource.disconnect(),window.ringtoneSource=null)}},pushEvent:t=>{b.sendMessage("push-event",{eventName:t})},onLoad:({widgetColor:t,logoColors:e})=>{const o=b.getAppFrame();if(o.style.visibility="",o.setAttribute("id","chatwoot_live_chat_widget"),b.getBubbleHolder().length)return;yt(window.$chatwoot.hideMessageBubble),at();let w="woot-widget-bubble",a=`woot-elements--${window.$chatwoot.position} woot-widget-bubble woot--close woot--hide`;V(window.$chatwoot.widgetStyle)&&(w+=" woot-widget-bubble--flat",a+=" woot-widget-bubble--flat"),At(t)&&(w+=" woot-widget-bubble-color--lighter",a+=" woot-widget-bubble-color--lighter");const u=vt({className:w,path:window.$chatwoot.type==="standard"?pt:mt,target:U,logoColors:e,widgetColor:window.$chatwoot.type==="standard"?t:"#FFFFFF"});if(y.appendChild(u),window.$chatwoot.type==="standard"){const r=xt({className:a,target:A,widgetColor:t});y.appendChild(r)}else u.style.background=t,A.style.background=t,A.title="Close chat window",v(A,a),y.appendChild(A);Ct()},toggleCloseButton:()=>{let t=!1;window.matchMedia("(max-width: 668px)").matches&&(t=!0),b.sendMessage("toggle-close-button",{isMobile:t})}},Vt="sdk-set-bubble-visibility";console.log("Loaded widget: ");const qt=({baseUrl:t,websiteToken:e})=>{if(console.log("Loaded: ",e),window.$chatwoot)return;const o=e.split("?oseid");e=o?o[0]:"Invalid",document.addEventListener("turbo:before-render",r=>{r.detail.renderMethod!=="morph"&&k(r.detail.newBody)}),window.Turbolinks&&document.addEventListener("turbolinks:before-render",r=>{k(r.data.newBody)}),document.addEventListener("astro:before-swap",r=>k(r.newDocument.body));const w=window.chatwootSettings||{};let a=w.locale,u=w.baseDomain;w.useBrowserLanguage&&(a=window.navigator.language.replace("-","_")),window.$chatwoot={baseUrl:t,baseDomain:u,hasLoaded:!1,hideMessageBubble:w.hideMessageBubble||!1,isOpen:!1,position:w.position==="left"?"left":"right",websiteToken:e,locale:a,useBrowserLanguage:w.useBrowserLanguage||!1,type:P(w.type),launcherTitle:w.launcherTitle||"",showPopoutButton:w.showPopoutButton||!1,showUnreadMessagesDialog:w.showUnreadMessagesDialog??!0,widgetStyle:dt(w.widgetStyle)||"standard",resetTriggered:!1,darkMode:q(w.darkMode),toggle(r){b.events.toggleBubble(r)},toggleBubbleVisibility(r){let i=document.querySelector(".woot--bubble-holder"),h=document.querySelector(".woot-widget-holder");r==="hide"?(v(h,"woot-widget--without-bubble"),v(i,"woot-hidden"),window.$chatwoot.hideMessageBubble=!0):r==="show"&&(_(i,"woot-hidden"),_(h,"woot-widget--without-bubble"),window.$chatwoot.hideMessageBubble=!1),b.sendMessage(Vt,{hideMessageBubble:window.$chatwoot.hideMessageBubble})},popoutChatWindow(){b.events.popoutChatWindow({baseUrl:window.$chatwoot.baseUrl,websiteToken:window.$chatwoot.websiteToken,locale:a})},setUser(r,i){if(typeof r!="string"&&typeof r!="number")throw new Error("Identifier should be a string or a number");if(!Dt(i))throw new Error("User object should have one of the keys [avatar_url, email, name]");const h=I(),s=S.get(h),n=Ut({identifier:r,user:i});n!==s&&(window.$chatwoot.identifier=r,window.$chatwoot.user=i,b.sendMessage("set-user",{identifier:r,user:i}),O(h,n,{baseDomain:u}))},setCustomAttributes(r={}){if(!r||!Object.keys(r).length)throw new Error("Custom attributes should have atleast one key");b.sendMessage("set-custom-attributes",{customAttributes:r})},deleteCustomAttribute(r=""){if(r)b.sendMessage("delete-custom-attribute",{customAttribute:r});else throw new Error("Custom attribute is required")},setConversationCustomAttributes(r={}){if(!r||!Object.keys(r).length)throw new Error("Custom attributes should have atleast one key");b.sendMessage("set-conversation-custom-attributes",{customAttributes:r})},deleteConversationCustomAttribute(r=""){if(r)b.sendMessage("delete-conversation-custom-attribute",{customAttribute:r});else throw new Error("Custom attribute is required")},setLabel(r=""){b.sendMessage("set-label",{label:r})},removeLabel(r=""){b.sendMessage("remove-label",{label:r})},setLocale(r="en"){b.sendMessage("set-locale",{locale:r})},setColorScheme(r="light"){b.sendMessage("set-color-scheme",{darkMode:q(r)})},reset(){window.$chatwoot.isOpen&&b.events.toggleBubble(),S.remove("cw_conversation"),S.remove(I());const r=b.getAppFrame();r.src=b.getUrl({baseUrl:window.$chatwoot.baseUrl,websiteToken:window.$chatwoot.websiteToken}),window.$chatwoot.resetTriggered=!0}},b.createFrame({baseUrl:t,websiteToken:e})};window.chatwootSDK={run:qt}})();
