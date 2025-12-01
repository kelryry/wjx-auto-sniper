// ==UserScript==
// @name         问卷星AI自动填写 (Gemini版)
// @version      1.1
// @description  利用 Google Gemini 模型自动根据人设回答问卷。
// @author       ZainCheung (原作者) & kelryry (AI适配版作者)
// @license      GPL-3.0-only
// @source       https://github.com/kelryry/wjx-auto-sniper
// ...其他配置...
// ==/UserScript==

/*
 * Copyright (C) 2025 kelryry
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * =================================================================
 * ACKNOWLEDGEMENT / 致谢:
 * This script is a derivative work based on "问卷星自动随机答题" by ZainCheung,
 * originally licensed under the Apache License 2.0.
 * Original Source: https://github.com/ZainCheung/wenjuanxin
 * =================================================================
 */

(function() {
    'use strict';

    // =========================================================================
    //                            用户配置区 (修改这里)
    // =========================================================================
    const USER_CONFIG = {
        // Google Gemini API Key (必填)
        GEMINI_API_KEY: "",

        // 模型选择
        // 推荐: "gemini-flash-lite-latest" (速度最快，适合抢答)
        // 备选: "gemini-2.5-flash" (能力更强，稍微慢一点点)
        // 旗舰: "gemini-2.5-pro" (最强推理，主要用于非常复杂的逻辑)
        MODEL_NAME: "gemini-flash-lite-latest",

        // 问卷回答人设 (AI将依据此人设答题)
        PERSONA: `
            我是一名22岁的男性大三学生，主修计算机科学。
            生活费每月2000元，主要来源于父母支持。
            平时喜欢打游戏、看科技新闻。
            性格比较直率，对未来充满希望但也有就业焦虑。
            对于恋爱话题，我目前单身，期望另一半温柔体贴。
            我不介意对象谈过多次恋爱
            我不喜欢异地恋
            如果题目所需的信息我没有提及，就按照我已有的信息进行推断，但是不要空着不写
        `,

        // 抢答开始时间 (格式：YYYY-MM-DD HH:mm:ss，填写过去的时间将直接开始答题)
        START_TIME: "2025-12-01 10:00:00",

        // 刷新提前量 (秒)，比如设置为 0.3，则在 09:59:59.700 刷新
        PRE_LOAD_OFFSET: 0.3,

        // 是否自动点击提交按钮
        // true: 填完直接交 (风险较高，建议全自动场景用)
        // false: 填完跳转到提交按钮或未填题目，等待人工点击 (推荐)
        AUTO_SUBMIT: false
    };

    // =========================================================================
    //                            核心逻辑区
    // =========================================================================

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${USER_CONFIG.MODEL_NAME}:generateContent?key=${USER_CONFIG.GEMINI_API_KEY}`;

    // ---------------------- 1. 时间控制与重定向 ----------------------
    function checkTimeAndRedirect() {
        // 移动端转PC端
        let currentURL = window.location.href;
        let pat = /(https:\/\/www\.wjx\.cn\/)(jq|m)(.*)/g;
        let obj = pat.exec(currentURL);
        if (obj && obj[2] == "m") {
            console.log("检测到移动端，正在切换回PC端以适配脚本...");
            window.location.href = obj[1] + "jq" + obj[3];
            return false;
        }

        // 抢答时间控制
        const targetTime = new Date(USER_CONFIG.START_TIME).getTime();
        const now = Date.now();
        const bufferMs = USER_CONFIG.PRE_LOAD_OFFSET * 1000;
        const waitTime = targetTime - now - bufferMs;

        if (waitTime > 0) {
            console.log(`[Timer] 尚未到达开放时间。将在 ${waitTime / 1000} 秒后刷新页面。`);
            let div = document.createElement('div');
            div.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);color:white;z-index:9999;display:flex;justify-content:center;align-items:center;font-size:24px;";
            div.id = "timer-mask";
            document.body.appendChild(div);

            let interval = setInterval(() => {
                let remain = targetTime - Date.now() - bufferMs;
                if (remain <= 0) {
                    clearInterval(interval);
                    location.reload();
                }
                div.innerText = `等待抢答... 剩余: ${(remain/1000).toFixed(1)}秒`;
            }, 100);

            setTimeout(() => {
                location.reload();
            }, waitTime);
            return false;
        }

        let mask = document.getElementById("timer-mask");
        if(mask) mask.remove();
        return true;
    }

    // ---------------------- 2. 题目提取 (Scraping) ----------------------
    function extractQuestions() {
        const questions = [];
        const divs = document.getElementsByClassName("div_question");

        for (let i = 0; i < divs.length; i++) {
            const div = divs[i];
            const qId = div.id.replace("div", "");
            const label = div.querySelector(".div_title_question_all");
            const title = label ? label.innerText.replace(/\r\n/g,"").trim() : "未获取到标题";

            let type = "unknown";
            let options = [];

            if (div.querySelector(".ulradiocheck")) {
                const lis = div.querySelectorAll("li");
                lis.forEach((li, idx) => {
                    options.push({index: idx, text: li.innerText.trim()});
                });
                const input = div.querySelector("input");
                if (input) {
                    type = input.type === 'radio' ? 'radio' : 'checkbox';
                }
            } else if (div.querySelector("textarea")) {
                type = 'text';
            } else {
                type = 'complex';
            }

            // 只提取 AI 能做的题
            if (type !== 'complex') {
                questions.push({
                    id: qId,
                    type: type,
                    title: title,
                    options: options
                });
            }
        }
        return questions;
    }

    // ---------------------- 3. AI 交互 (API) ----------------------
    async function getAnswersFromAI(questionBatch) {
        if (questionBatch.length === 0) return [];

        const prompt = `
            Role: ${USER_CONFIG.PERSONA}
            Task: Answer the survey questions.
            Format: JSON Array only. No Markdown.
            
            Requirements:
            - 'radio': "selection_index" (int, 0-based).
            - 'checkbox': "selection_indices" (array of int).
            - 'text': "content" (string).
            
            Questions:
            ${JSON.stringify(questionBatch)}
        `;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: API_URL,
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify(payload),
                onload: function(response) {
                    try {
                        const resJson = JSON.parse(response.responseText);
                        if(resJson.error) {
                            console.error("API Error:", resJson.error);
                            resolve([]); return;
                        }
                        let rawText = resJson.candidates[0].content.parts[0].text;
                        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
                        resolve(JSON.parse(rawText));
                    } catch (e) {
                        console.error("JSON Parse Error", e);
                        resolve([]);
                    }
                },
                onerror: () => resolve([])
            });
        });
    }

    // ---------------------- 4. 填写逻辑 ----------------------
    function fillQuestion(qId, aiAnswer) {
        const div = document.getElementById("div" + qId);
        if (!div) return;

        if (aiAnswer.content) {
            const textarea = div.querySelector("textarea");
            if (textarea) {
                textarea.value = aiAnswer.content;
                textarea.dispatchEvent(new Event('input'));
                textarea.dispatchEvent(new Event('blur'));
            }
        } else if (aiAnswer.selection_index !== undefined) {
            const lis = div.querySelectorAll("li");
            const target = lis[aiAnswer.selection_index];
            if (target) {
                const img = target.querySelector("img");
                (img || target).click();
            }
        } else if (aiAnswer.selection_indices) {
            const lis = div.querySelectorAll("li");
            aiAnswer.selection_indices.forEach(idx => {
                if (lis[idx]) {
                    const input = lis[idx].querySelector("input");
                    if(input && !input.checked) lis[idx].click();
                }
            });
        }
    }

    // ---------------------- 5. 辅助与导航逻辑 ----------------------

    // 检查题目是否已填写 (包含复杂题型的基础检查)
    function isQuestionFilled(div) {
        // 检查 Input (Radio/Checkbox)
        const checkedInputs = div.querySelectorAll('input:checked');
        if (checkedInputs.length > 0) return true;

        // 检查 TextArea
        const textarea = div.querySelector('textarea');
        if (textarea && textarea.value.trim() !== '') return true;

        // 检查 Select 下拉框
        const select = div.querySelector('select');
        if (select && select.value !== '' && select.value !== '0') return true;

        return false;
    }

    function navigateToNextAction() {
        const allDivs = document.getElementsByClassName("div_question");
        let firstUnfilled = null;

        // 寻找第一个未填写的题目
        for (let i = 0; i < allDivs.length; i++) {
            if (!isQuestionFilled(allDivs[i])) {
                firstUnfilled = allDivs[i];
                break;
            }
        }

        if (firstUnfilled) {
            console.log("[Nav] 发现未填题目，跳转中...", firstUnfilled.id);
            // 滚动并高亮
            firstUnfilled.scrollIntoView({ behavior: "smooth", block: "center" });
            // 给个红色边框提示用户
            firstUnfilled.style.border = "3px solid #ff4d4f";
            firstUnfilled.style.borderRadius = "8px";
        } else {
            console.log("[Nav] 所有题目已完成，跳转至提交区");
            const submitBtn = document.getElementById("submit_button");
            if (submitBtn) {
                submitBtn.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }

    // 针对复杂题型的简单随机（如果不希望随机，可以注释掉 processComplex 里的代码）
    const RandomHelper = {
        randint: function(min, max) { return Math.floor(Math.random() * (max - min + 1) + min); },
        processComplex: function(div) {
            // 这里只保留最稳妥的矩阵单选，其他太复杂的建议留给人工跳转
            if (div.querySelector("table")) {
                const trs = div.querySelectorAll("tbody > tr");
                trs.forEach(tr => {
                    const tds = tr.querySelectorAll("td");
                    if(tds.length > 0 && !tr.querySelector("input:checked")) {
                        tds[this.randint(0, tds.length - 1)].click();
                    }
                });
            }
        }
    };

    // ---------------------- 主流程 Main ----------------------
    async function main() {
        if (!checkTimeAndRedirect()) return;

        // 1. 扫描题目
        const allQuestions = extractQuestions();
        console.log(`[Main] 开始 AI 填写，共 ${allQuestions.length} 题`);

        // 2. 分批 AI 填写
        const batchSize = 20;
        for (let i = 0; i < allQuestions.length; i += batchSize) {
            const batch = allQuestions.slice(i, i + batchSize);
            const aiAnswers = await getAnswersFromAI(batch);
            aiAnswers.forEach(ans => fillQuestion(ans.id, ans));
            // 极短间隔，防止页面无响应即可
            await new Promise(r => setTimeout(r, 200));
        }

        // 3. 查漏补缺 (对复杂题型尝试简单随机，或保持原样等待人工)
        const allDivs = document.getElementsByClassName("div_question");
        for (let i = 0; i < allDivs.length; i++) {
            // 如果没填，尝试用 RandomHelper 补一下矩阵题
            if (!isQuestionFilled(allDivs[i])) {
                RandomHelper.processComplex(allDivs[i]);
            }
        }

        // 4. 提交或跳转
        if (USER_CONFIG.AUTO_SUBMIT) {
            console.log("[Main] 自动提交中...");
            const submitBtn = document.getElementById("submit_button");
            if(submitBtn) {
                submitBtn.click();
                setTimeout(() => {
                    const confirmBtn = document.querySelector(".layui-layer-btn0");
                    if(confirmBtn) confirmBtn.click();
                }, 800);
            }
        } else {
            // 不自动提交：无弹窗，无延迟，直接跳转
            navigateToNextAction();
        }
    }

    // 启动
    setTimeout(main, 800);

})();