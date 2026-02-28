const main = document.querySelector("main");
const templates = document.querySelector(".templates");
const userMsg = document.querySelector(".userMsg");
const botMsg = document.querySelector(".botMsg");
const userInput = document.querySelector("#userInput");
const sendBtn = document.querySelector("#sendBtn");

////////// GET GROQ API KEY FROM -> https://console.groq.com/keys /////////
const api_key = "GROQ_API_KEY";
//////// MAKE YOUR CUSTOM PROMPT //////
const prompt = `You are Kevo Ai made by a developer named Kelvin Kevo. You favorite programming language is JavaScript and python. Your main role is guiding and vibing with human like responses to keep conversation interesting`;

const bot_url = "https://api.groq.com/openai/v1/chat/completions";
const model = "llama-3.1-8b-instant";
const date = new Date().toISOString();
const history = JSON.parse(localStorage.getItem("msgHistory")) || [];

let isLoading = false;

// APPEND THE TEMPLATE TO THE DOM
templates.querySelectorAll("div").forEach(template => {
  template.addEventListener("click", (e) => {
    const value = e.target.textContent.trim();
    let time = date.substring(date.indexOf('T')+1, date.lastIndexOf("."))
    appendToDom(value, "user", time)
    // remove initial class
    main.classList.remove("initial")
    // get automated response
    isLoading = true;
    getBotResponse(value)
  })
})

function scrollToBottom() {
  if (main) {
    main.scrollTop = main.scrollHeight;
  }
}

function appendToDom(text, from, time){
  if(isLoading) return;
  const div = document.createElement("div");
  div.classList.add(from === "user" ? "userMsg": "botMsg");
  div.innerHTML = from === "user" ? `      <div class="msg">
        <p>${text}</p>
        <span class="userAvatar">👤</span>
      </div>
      <br>
      <div class="showTime">
        <p>${time}</p>
      </div>`:
      `<div class="msg">
        <span class="botAvatar">🤖</span>
        <p>${text}</p>
      </div>
      <div class="showTime">
        <p>${time}</p>
      </div>`;
  // remove the templates
  if(templates && main.contains(templates)){
    main.removeChild(templates);
  }
  main.appendChild(div);
  scrollToBottom();
}

// get user input 
sendBtn.addEventListener("click", () => {
  const text = userInput.value.trim();
  if(!text){
    return alert("please write something");
  }
  if(!isLoading){
    let time = date.substring(date.indexOf('T')+1, date.lastIndexOf("."))
    appendToDom(text, "user", time);
    userInput.value = '';
    // remove initial class
    main.classList.remove("initial");
    // get automated response
    isLoading = true;
    getBotResponse(text);
  }
})

async function getBotResponse(text){
  try{
    let filtered = history.map(h => ({
      role: h.role,
      content: h.content
    }))
    const response = await fetch(bot_url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${api_key}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{
          role: "system",
          content: prompt
        },
        ...filtered,
        {
          role: "user",
          content: text
        }]
      })
    })
    const data = await response.json();
    const botResponse = data.choices[0].message.content;
    // add all to localStorage
    let time = date.substring(date.indexOf('T')+1, date.lastIndexOf("."));
    history.push({"role": "user", 'content': text, "time": time})
    history.push({"role": "system", 'content': botResponse, "time": time})
    localStorage.setItem("msgHistory", JSON.stringify(history))
    isLoading = false;
    
    appendToDom(formatResponse(botResponse), "system", time)
  }catch(err){
    isLoading = false
    let time = date.substring(date.indexOf('T')+1, date.lastIndexOf("."))
    appendToDom("⚠️"+err.message, "system");
    botMsg.style.color = "tomato"
  }
}

function formatResponse(message){
  if (!message) return '';
  
  return message
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

window.addEventListener("load", () => {
  const hist = JSON.parse(localStorage.getItem("msgHistory"));
  if(hist.length === 0) return
  // remove initial class
  main.classList.remove("initial")
  hist.forEach((h) => {
    appendToDom(formatResponse(h.content), h.role, h.time)
  })
})