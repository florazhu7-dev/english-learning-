const builtInLessons = [
  {
    id: "travel-hotel",
    category: "travel",
    tag: "旅游英语",
    title: "Hotel Check-in",
    sentences: [
      { text: "Good evening. I have a reservation under the name Fang.", cn: "晚上好，我用 Fang 这个名字订了房。" },
      { text: "Could I have a room on a higher floor, please?", cn: "请问可以给我一间高楼层的房间吗？" },
      { text: "What time is breakfast served tomorrow morning?", cn: "明天早上早餐几点供应？" },
      { text: "Could you help me call a taxi to the airport?", cn: "可以帮我叫一辆去机场的出租车吗？" }
    ]
  },
  {
    id: "travel-restaurant",
    category: "travel",
    tag: "旅游英语",
    title: "At a Restaurant",
    sentences: [
      { text: "Do you have a table for two by the window?", cn: "有靠窗的两人桌吗？" },
      { text: "Could you recommend a local dish that is not too spicy?", cn: "可以推荐一道不太辣的当地菜吗？" },
      { text: "May I have the bill when you have a moment?", cn: "你方便的时候可以给我账单吗？" },
      { text: "Everything was delicious. Thank you for your service.", cn: "菜都很好吃，谢谢你的服务。" }
    ]
  },
  {
    id: "travel-directions",
    category: "travel",
    tag: "旅游英语",
    title: "Asking for Directions",
    sentences: [
      { text: "Excuse me, is this the right way to the train station?", cn: "打扰一下，这是去火车站的路吗？" },
      { text: "How long does it take to walk there from here?", cn: "从这里走过去要多久？" },
      { text: "Could you show me on the map?", cn: "可以在地图上指给我看吗？" },
      { text: "Thank you. I think I can find it now.", cn: "谢谢，我现在应该能找到了。" }
    ]
  },
  {
    id: "nce2-museum",
    category: "nce2",
    tag: "新概念2风格",
    title: "A Quiet Museum",
    sentences: [
      { text: "Last Sunday, I visited a small museum near the river.", cn: "上周日，我参观了河边的一家小博物馆。" },
      { text: "The rooms were quiet, but every object seemed to tell a story.", cn: "房间很安静，但每件物品好像都在讲故事。" },
      { text: "A guide explained the history of an old clock in clear English.", cn: "一位导游用清楚的英语讲解了一座老钟的历史。" },
      { text: "I listened carefully and wrote down several useful expressions.", cn: "我认真听，并记下了几个有用表达。" }
    ]
  },
  {
    id: "nce2-letter",
    category: "nce2",
    tag: "新概念2风格",
    title: "A Letter from Abroad",
    sentences: [
      { text: "Yesterday morning, I received a letter from a friend in London.", cn: "昨天早上，我收到了一封伦敦朋友寄来的信。" },
      { text: "He said that he had just moved into a bright new flat.", cn: "他说他刚搬进一套明亮的新公寓。" },
      { text: "Although the city is expensive, he enjoys walking through its old streets.", cn: "虽然这座城市很贵，他仍喜欢穿过那些老街散步。" },
      { text: "He invited me to visit him during my next holiday.", cn: "他邀请我下次假期去看他。" }
    ]
  }
];

const storageKeys = {
  custom: "shadowing.customLessons",
  progress: "shadowing.progress",
  scores: "shadowing.scores"
};

let lessons = [...builtInLessons, ...loadCustomLessons()];
let activeFilter = "all";
let activeLessonId = lessons[0].id;
let activeSentenceIndex = 0;
let timer = null;
let sessionSeconds = 0;
let mediaRecorder = null;
let audioFallbackRecorder = null;
let activeRecognition = null;
let recordingTimer = null;
let recordingStartedAt = 0;
let chunks = [];
let currentRecordingUrl = "";
let recognitionResult = "";

const els = {
  todayLabel: document.querySelector("#todayLabel"),
  dailyMinutes: document.querySelector("#dailyMinutes"),
  progressRing: document.querySelector("#progressRing"),
  timerToggle: document.querySelector("#timerToggle"),
  timerReset: document.querySelector("#timerReset"),
  sessionTime: document.querySelector("#sessionTime"),
  lessonList: document.querySelector("#lessonList"),
  tabs: document.querySelectorAll(".tab"),
  lessonTag: document.querySelector("#lessonTag"),
  lessonTitle: document.querySelector("#lessonTitle"),
  lessonAverage: document.querySelector("#lessonAverage"),
  sentenceCount: document.querySelector("#sentenceCount"),
  sentenceScore: document.querySelector("#sentenceScore"),
  sentenceText: document.querySelector("#sentenceText"),
  sentenceCn: document.querySelector("#sentenceCn"),
  prevSentence: document.querySelector("#prevSentence"),
  speakSentence: document.querySelector("#speakSentence"),
  recordBtn: document.querySelector("#recordBtn"),
  playRecording: document.querySelector("#playRecording"),
  scoreBtn: document.querySelector("#scoreBtn"),
  nextSentence: document.querySelector("#nextSentence"),
  scoreBar: document.querySelector("#scoreBar"),
  feedback: document.querySelector("#feedback"),
  sentenceList: document.querySelector("#sentenceList"),
  importDialog: document.querySelector("#importDialog"),
  openImport: document.querySelector("#openImport"),
  saveCustom: document.querySelector("#saveCustom"),
  customTitle: document.querySelector("#customTitle"),
  customCategory: document.querySelector("#customCategory"),
  customBody: document.querySelector("#customBody")
};

init();

function init() {
  els.todayLabel.textContent = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date());
  bindEvents();
  updateDailyProgress();
  renderLessons();
  renderReader();
}

function bindEvents() {
  els.timerToggle.addEventListener("click", toggleTimer);
  els.timerReset.addEventListener("click", resetSessionTimer);
  els.prevSentence.addEventListener("click", () => moveSentence(-1));
  els.nextSentence.addEventListener("click", () => moveSentence(1));
  els.speakSentence.addEventListener("click", speakCurrentSentence);
  els.recordBtn.addEventListener("click", toggleRecording);
  els.playRecording.addEventListener("click", playRecording);
  els.scoreBtn.addEventListener("click", scoreCurrentSentence);
  els.openImport.addEventListener("click", () => els.importDialog.showModal());
  els.saveCustom.addEventListener("click", saveCustomLesson);
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeFilter = tab.dataset.filter;
      els.tabs.forEach((item) => item.classList.toggle("active", item === tab));
      const visible = getVisibleLessons();
      activeLessonId = visible[0]?.id || lessons[0].id;
      activeSentenceIndex = 0;
      renderLessons();
      renderReader();
    });
  });
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getProgress() {
  const progress = JSON.parse(localStorage.getItem(storageKeys.progress) || "{}");
  return progress[todayKey()] || 0;
}

function setProgress(seconds) {
  const progress = JSON.parse(localStorage.getItem(storageKeys.progress) || "{}");
  progress[todayKey()] = Math.max(0, seconds);
  localStorage.setItem(storageKeys.progress, JSON.stringify(progress));
}

function toggleTimer() {
  if (timer) {
    stopTimer();
    return;
  }
  els.timerToggle.textContent = "Ⅱ";
  els.timerToggle.setAttribute("aria-label", "暂停计时");
  timer = setInterval(() => {
    sessionSeconds += 1;
    setProgress(getProgress() + 1);
    updateDailyProgress();
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
  els.timerToggle.textContent = "▶";
  els.timerToggle.setAttribute("aria-label", "开始计时");
}

function resetSessionTimer() {
  sessionSeconds = 0;
  updateDailyProgress();
}

function updateDailyProgress() {
  const totalSeconds = getProgress();
  const minutes = Math.floor(totalSeconds / 60);
  const percent = Math.min(totalSeconds / 1800, 1);
  els.dailyMinutes.textContent = String(minutes);
  els.sessionTime.textContent = formatTime(sessionSeconds);
  els.progressRing.style.background = `conic-gradient(var(--accent) ${percent * 360}deg, var(--soft) 0deg)`;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function getVisibleLessons() {
  if (activeFilter === "all") return lessons;
  return lessons.filter((lesson) => lesson.category === activeFilter);
}

function activeLesson() {
  return lessons.find((lesson) => lesson.id === activeLessonId) || lessons[0];
}

function activeSentence() {
  return activeLesson().sentences[activeSentenceIndex];
}

function renderLessons() {
  const visible = getVisibleLessons();
  els.lessonList.innerHTML = "";
  visible.forEach((lesson) => {
    const button = document.createElement("button");
    button.className = `lesson-item${lesson.id === activeLessonId ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `<strong>${escapeHtml(lesson.title)}</strong><span>${lesson.tag} · ${lesson.sentences.length} 句</span>`;
    button.addEventListener("click", () => {
      activeLessonId = lesson.id;
      activeSentenceIndex = 0;
      renderLessons();
      renderReader();
    });
    els.lessonList.appendChild(button);
  });
}

function renderReader() {
  const lesson = activeLesson();
  const sentence = activeSentence();
  els.lessonTag.textContent = lesson.tag;
  els.lessonTitle.textContent = lesson.title;
  els.sentenceCount.textContent = `${activeSentenceIndex + 1} / ${lesson.sentences.length}`;
  els.sentenceText.textContent = sentence.text;
  els.sentenceCn.textContent = sentence.cn || "";
  els.playRecording.disabled = !currentRecordingUrl;
  recognitionResult = "";
  renderScore();
  renderSentenceList();
}

function renderSentenceList() {
  const lesson = activeLesson();
  els.sentenceList.innerHTML = "";
  lesson.sentences.forEach((sentence, index) => {
    const score = getSentenceScore(lesson.id, index);
    const chip = document.createElement("button");
    chip.className = `sentence-chip${index === activeSentenceIndex ? " active" : ""}`;
    chip.type = "button";
    chip.innerHTML = `<span>${escapeHtml(sentence.text)}</span><small>${score ? `${score} 分` : "未完成"}</small>`;
    chip.addEventListener("click", () => {
      activeSentenceIndex = index;
      clearRecording();
      renderReader();
    });
    els.sentenceList.appendChild(chip);
  });
}

function renderScore() {
  const score = getSentenceScore(activeLesson().id, activeSentenceIndex);
  const scores = activeLesson().sentences
    .map((_, index) => getSentenceScore(activeLesson().id, index))
    .filter(Boolean);
  const average = scores.length ? Math.round(scores.reduce((sum, item) => sum + item, 0) / scores.length) : null;
  els.sentenceScore.textContent = score ? `${score} 分` : "尚未评分";
  els.lessonAverage.textContent = average || "--";
  els.scoreBar.style.width = `${score || 0}%`;
}

function moveSentence(step) {
  const lesson = activeLesson();
  activeSentenceIndex = (activeSentenceIndex + step + lesson.sentences.length) % lesson.sentences.length;
  clearRecording();
  renderReader();
}

function speakCurrentSentence() {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(activeSentence().text);
  utterance.lang = "en-US";
  utterance.rate = 0.86;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

async function toggleRecording() {
  if (isRecording()) {
    stopActiveRecording();
    return;
  }

  if (!window.isSecureContext) {
    els.feedback.textContent = "当前页面不是安全环境，浏览器不会开放麦克风。请用 http://localhost:5173 或部署到 HTTPS 后再录音。";
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    els.feedback.textContent = "当前浏览器没有开放麦克风接口。请换 Safari/Chrome 的 HTTPS 页面，或用 localhost 预览。";
    return;
  }

  try {
    preparePermissionUi();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    clearRecording();
    prepareRecordingUi();

    if (window.MediaRecorder) {
      startMediaRecorder(stream);
    } else {
      await startAudioFallbackRecorder(stream);
    }
  } catch (error) {
    resetRecordingUi();
    els.feedback.textContent = recordingErrorMessage(error);
  }
}

function recordingErrorMessage(error) {
  if (error?.name === "NotAllowedError") {
    return "麦克风权限被拒绝了。请在浏览器地址栏重新允许麦克风；如果是在 Codex 内置浏览器里看，建议复制 http://localhost:5173 到 Safari 或 Chrome 打开。";
  }
  if (error?.name === "NotFoundError") {
    return "没有检测到可用麦克风。请检查系统输入设备。";
  }
  return "无法启动麦克风。请确认页面用 localhost 或 HTTPS 打开，并允许麦克风权限。";
}

function startSpeechRecognition() {
  recognitionResult = "";
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return;
  try {
    activeRecognition = new Recognition();
    activeRecognition.lang = "en-US";
    activeRecognition.interimResults = false;
    activeRecognition.maxAlternatives = 1;
    activeRecognition.addEventListener("result", (event) => {
      recognitionResult = event.results[0]?.[0]?.transcript || "";
    });
    activeRecognition.addEventListener("end", () => {
      activeRecognition = null;
    });
    activeRecognition.start();
  } catch (error) {
    activeRecognition = null;
  }
}

function startMediaRecorder(stream) {
  chunks = [];
  const options = getSupportedRecorderOptions();
  mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
  mediaRecorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });
  mediaRecorder.addEventListener("stop", () => {
    stream.getTracks().forEach((track) => track.stop());
    const type = mediaRecorder.mimeType || options?.mimeType || "audio/webm";
    finishRecording(new Blob(chunks, { type }));
    mediaRecorder = null;
  });
  mediaRecorder.start();
}

function getSupportedRecorderOptions() {
  if (!window.MediaRecorder?.isTypeSupported) return null;
  const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
  return mimeType ? { mimeType } : null;
}

async function startAudioFallbackRecorder(stream) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error("AudioContextUnsupported");
  }

  const audioContext = new AudioContext();
  if (audioContext.state === "suspended") await audioContext.resume();

  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  const samples = [];

  processor.onaudioprocess = (event) => {
    samples.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };
  source.connect(processor);
  processor.connect(audioContext.destination);

  audioFallbackRecorder = {
    state: "recording",
    stop: async () => {
      audioFallbackRecorder.state = "inactive";
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      const blob = encodeWav(samples, audioContext.sampleRate);
      await audioContext.close();
      finishRecording(blob);
      audioFallbackRecorder = null;
    }
  };
}

function isRecording() {
  return mediaRecorder?.state === "recording" || audioFallbackRecorder?.state === "recording";
}

function stopActiveRecording() {
  try {
    activeRecognition?.stop();
  } catch (error) {
    activeRecognition = null;
  }
  if (mediaRecorder?.state === "recording") {
    mediaRecorder.stop();
  } else if (audioFallbackRecorder?.state === "recording") {
    audioFallbackRecorder.stop();
  }
}

function finishRecording(blob) {
  if (currentRecordingUrl) URL.revokeObjectURL(currentRecordingUrl);
  currentRecordingUrl = URL.createObjectURL(blob);
  els.playRecording.disabled = false;
  stopRecordingTimer();
  els.feedback.textContent = "录音已保存。现在可以点右边的播放按钮听自己的录音。";
  resetRecordingUi("重录");
}

function preparePermissionUi() {
  els.recordBtn.disabled = true;
  els.recordBtn.textContent = "等待授权";
  els.playRecording.disabled = true;
  els.feedback.textContent = "请在左上角浏览器弹窗里点“允许”。允许后会自动开始录音，再点“停止”保存。";
}

function prepareRecordingUi() {
  els.recordBtn.disabled = false;
  els.recordBtn.classList.add("recording");
  els.playRecording.disabled = true;
  startRecordingTimer();
}

function resetRecordingUi(label = "录音") {
  stopRecordingTimer();
  els.recordBtn.disabled = false;
  els.recordBtn.classList.remove("recording");
  els.recordBtn.textContent = label;
}

function startRecordingTimer() {
  stopRecordingTimer();
  recordingStartedAt = Date.now();
  updateRecordingTimer();
  recordingTimer = setInterval(updateRecordingTimer, 250);
}

function updateRecordingTimer() {
  const seconds = Math.max(0, Math.floor((Date.now() - recordingStartedAt) / 1000));
  els.recordBtn.textContent = `停止 ${formatTime(seconds)}`;
  els.feedback.textContent = `正在录音 ${formatTime(seconds)}。读完这一句后点“停止”，录音保存后播放按钮会亮起。`;
}

function stopRecordingTimer() {
  if (!recordingTimer) return;
  clearInterval(recordingTimer);
  recordingTimer = null;
}

function encodeWav(buffers, sampleRate) {
  const length = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
  const pcm = new Float32Array(length);
  let offset = 0;
  buffers.forEach((buffer) => {
    pcm.set(buffer, offset);
    offset += buffer.length;
  });

  const dataSize = pcm.length * 2;
  const wav = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wav);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let index = 44;
  for (let i = 0; i < pcm.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    index += 2;
  }

  return new Blob([view], { type: "audio/wav" });
}

function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

function playRecording() {
  if (!currentRecordingUrl) return;
  const audio = new Audio(currentRecordingUrl);
  audio.addEventListener("ended", () => {
    els.feedback.textContent = "录音播放完毕。";
  });
  audio.play()
    .then(() => {
      els.feedback.textContent = "正在播放你的录音。";
    })
    .catch(() => {
      els.feedback.textContent = "浏览器没有播放这段录音。请先点一次页面里的按钮后再播放，或重新录一遍。";
    });
}

function scoreCurrentSentence() {
  const target = activeSentence().text;
  let score;
  let feedback;
  if (recognitionResult) {
    score = similarityScore(target, recognitionResult);
    feedback = `识别结果：${recognitionResult}`;
  } else if (currentRecordingUrl) {
    score = 72;
    feedback = "已录音。当前浏览器没有返回语音识别文本，先给基础完成分；建议边听回放边重录。";
  } else {
    score = 0;
    feedback = "还没有录音。";
  }
  saveSentenceScore(activeLesson().id, activeSentenceIndex, score);
  els.feedback.textContent = feedback;
  renderScore();
  renderSentenceList();
}

function similarityScore(target, spoken) {
  const targetWords = normalizeWords(target);
  const spokenWords = normalizeWords(spoken);
  if (!targetWords.length || !spokenWords.length) return 0;
  const distance = levenshtein(targetWords, spokenWords);
  const similarity = 1 - distance / Math.max(targetWords.length, spokenWords.length);
  const coverage = spokenWords.filter((word) => targetWords.includes(word)).length / targetWords.length;
  return Math.max(0, Math.min(100, Math.round((similarity * 0.72 + coverage * 0.28) * 100)));
}

function normalizeWords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return matrix[a.length][b.length];
}

function getScores() {
  return JSON.parse(localStorage.getItem(storageKeys.scores) || "{}");
}

function getSentenceScore(lessonId, sentenceIndex) {
  return getScores()[`${lessonId}:${sentenceIndex}`] || 0;
}

function saveSentenceScore(lessonId, sentenceIndex, score) {
  const scores = getScores();
  scores[`${lessonId}:${sentenceIndex}`] = score;
  localStorage.setItem(storageKeys.scores, JSON.stringify(scores));
}

function loadCustomLessons() {
  return JSON.parse(localStorage.getItem(storageKeys.custom) || "[]");
}

function saveCustomLesson() {
  const title = els.customTitle.value.trim() || "自定义文章";
  const body = els.customBody.value.trim();
  const category = els.customCategory.value;
  if (!body) {
    els.customBody.focus();
    return;
  }
  const sentences = splitSentences(body).map((text) => ({ text, cn: "" }));
  const lesson = {
    id: `custom-${Date.now()}`,
    category,
    tag: category === "nce2" ? "新概念2风格" : category === "travel" ? "旅游英语" : "自定义",
    title,
    sentences
  };
  const customLessons = loadCustomLessons();
  customLessons.unshift(lesson);
  localStorage.setItem(storageKeys.custom, JSON.stringify(customLessons));
  lessons = [...builtInLessons, ...customLessons];
  activeFilter = category;
  activeLessonId = lesson.id;
  activeSentenceIndex = 0;
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.filter === category));
  els.customTitle.value = "";
  els.customBody.value = "";
  els.importDialog.close();
  renderLessons();
  renderReader();
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map((item) => item.trim())
    .filter(Boolean) || [];
}

function clearRecording() {
  if (currentRecordingUrl) URL.revokeObjectURL(currentRecordingUrl);
  currentRecordingUrl = "";
  els.playRecording.disabled = true;
  resetRecordingUi();
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
