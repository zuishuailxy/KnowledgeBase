"use strict";
window.onload = () => {
    class Wujie extends HTMLElement {
        constructor() {
            super();
            // 创建 Shadow DOM
            const shadow = this.attachShadow({ mode: "open" });
            const template = document.querySelector("#wujie-app");
            if (template) {
                // 克隆模板内容
                const clone = template.content.cloneNode(true);
                // 将克隆的内容添加到 Shadow DOM
                shadow.appendChild(clone);
            }
            else {
                console.error("Template with id 'wujie-app' not found.");
            }
            console.log(this.getAttr("name"));
        }
        connectedCallback() {
            console.log("自定义元素添加至页面。");
        }
        disconnectedCallback() {
            console.log("自定义元素从页面中移除。");
        }
        adoptedCallback() {
            console.log("自定义元素移动至新页面。");
        }
        getAttr(attr) {
            // 获取属性值
            return this.getAttribute(attr);
        }
        attributeChangedCallback(name, oldValue, newValue) {
            // 属性变化回调函数
            console.log(`Wujie app attribute changed: ${name} from ${oldValue} to ${newValue}`);
        }
    }
    // 挂载元素
    window.customElements.define("wujie-app", Wujie);
};
