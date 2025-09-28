// ===== Game State =====
let secret = Math.floor(Math.random()*100)+1;
let maxTime = 60; 
let timerInterval;
let player = {
  attemptsLeft:10,
  currentAttempts:0,
  progressEl:document.getElementById('p1Progress'),
  historyEl:document.getElementById('p1History'),
  micEl:document.getElementById('p1Mic'),
  elem:document.getElementById('player1'),
  recog:null
};
const messageEl=document.getElementById('message');
const timerEl=document.getElementById('timer');
const correctSound=document.getElementById('correctSound');
const wrongSound=document.getElementById('wrongSound');
const containerEl=document.getElementById('container');

// ===== Confetti =====
function confettiEffect(){
  const canvas=document.getElementById('confetti');
  const ctx=canvas.getContext('2d');
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
  const confetti=[];
  for(let i=0;i<200;i++){
    confetti.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,radius:Math.random()*6+2,color:`hsl(${Math.random()*360},100%,50%)`,dx:(Math.random()-0.5)*4,dy:(Math.random()-2)*4});
  }
  let count=0;
  function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    confetti.forEach(c=>{
      c.x+=c.dx; c.y+=c.dy+1;
      if(c.y>canvas.height){c.y=0;c.x=Math.random()*canvas.width;}
      ctx.beginPath();
      ctx.arc(c.x,c.y,c.radius,0,Math.PI*2);
      ctx.fillStyle=c.color;
      ctx.fill();
    });
    if(count<250){requestAnimationFrame(animate);count++;}
  }
  animate();
}

// ===== Leaderboard =====
function updateLeaderboard(attempts){
  let scores = JSON.parse(localStorage.getItem('leaderboard') || '[]');
  let newTop = 0; 
  if(attempts){
    const date = new Date();
    scores.push({attempts: attempts, date: date.toLocaleString()});
  }
  scores.sort((a,b)=>a.attempts-b.attempts);
  localStorage.setItem('leaderboard', JSON.stringify(scores));

  const leaderboardEl = document.getElementById('leaderboardList');
  leaderboardEl.innerHTML='';

  scores.slice(0,5).forEach((s,i)=>{
    const li=document.createElement('li');
    li.textContent = `${i+1}. ${s.attempts} attempts (${s.date})`;
    li.style.opacity = 0;
    setTimeout(()=>{li.style.opacity=1; li.style.transition='opacity 0.5s ease';},50);

    if(i===0) {li.classList.add('top1'); if(attempts) newTop=1;}
    else if(i===1) {li.classList.add('top2'); if(attempts && newTop===0) newTop=2;}
    else if(i===2) {li.classList.add('top3'); if(attempts && newTop===0) newTop=3;}

    leaderboardEl.appendChild(li);
  });

  if(newTop===1) { 
    messageEl.textContent=`🎉 Congratulations! You are #1!`;
    confettiEffect();
  } else if(newTop===2) {
    messageEl.textContent=`👏 Great job! You reached #2!`;
  } else if(newTop===3) {
    messageEl.textContent=`👍 Awesome! You reached #3!`;
  }
}
updateLeaderboard();

// ===== Timer =====
function startTimer(){
  clearInterval(timerInterval);
  let time=maxTime;
  timerEl.textContent=`⏱ Time left: ${time}s`;
  timerInterval=setInterval(()=>{
    time--;
    timerEl.textContent=`⏱ Time left: ${time}s`;
    if(time<=0){
      clearInterval(timerInterval);
      messageEl.textContent="⏳ Time's up! Game over!";
      disableInput();
    }
  },1000);
}

// ===== Game Logic =====
function submitGuess(){
  const input=document.getElementById('p1Input');
  const val=Number(input.value);
  if(isNaN(val)||val<1||val>100){alert('Enter 1–100'); return;}
  player.attemptsLeft--; player.currentAttempts++;
  player.progressEl.style.width=(player.attemptsLeft/10*100)+'%';
  const hist=document.createElement('div');
  if(val===secret){
    hist.textContent=`✅ ${val} Correct`;
    player.historyEl.prepend(hist);
    messageEl.textContent=`🎉 You win in ${player.currentAttempts} attempts!`;
    confettiEffect(); correctSound.play();
    player.elem.classList.add('winner');
    shakeScreen();
    updateLeaderboard(player.currentAttempts);
    disableInput();
  } else{
    const hint=val>secret?'📉 Too high':'📈 Too low';
    hist.textContent=`${val} — ${hint}`;
    player.historyEl.prepend(hist);
    messageEl.textContent=`${hint}`;
    wrongSound.play();
  }
  input.value='';
}

// ===== Screen Shake =====
function shakeScreen(){
  let i=0; const interval=setInterval(()=>{
    containerEl.style.transform=`translate(${(Math.random()-0.5)*10}px, ${(Math.random()-0.5)*10}px)`;
    i++;
    if(i>10){clearInterval(interval); containerEl.style.transform='';}
  },20);
}

// ===== Disable Input =====
function disableInput(){
  document.getElementById('p1Input').disabled=true;
  document.querySelectorAll('button').forEach(b=>{if(b.id!=='startBtn') b.disabled=true;});
  clearInterval(timerInterval);
}

// ===== Reset / New Game =====
function resetGame(){
  clearInterval(timerInterval);
  secret = Math.floor(Math.random()*100)+1;
  player.attemptsLeft=10; 
  player.currentAttempts=0; 
  player.progressEl.style.width='100%'; 
  player.historyEl.innerHTML='';
  player.elem.classList.remove('winner');
  if(player.recog){player.recog.stop(); player.recog=null;}
  player.micEl.classList.remove('listening');

  document.getElementById('p1Input').disabled = true;
  document.querySelectorAll('button').forEach(b=>{
    if(b.id !== 'startBtn') b.disabled = true;
  });
  document.getElementById('startBtn').disabled = false;

  messageEl.textContent='Click "Start Game" to begin!';
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
}

// ===== Start Game Button =====
document.getElementById('startBtn').addEventListener('click', ()=>{
  document.getElementById('p1Input').disabled = false;
  document.querySelectorAll('button').forEach(b=>{
    if(b.id !== 'startBtn') b.disabled = false;
  });
  document.getElementById('startBtn').disabled = true;
  messageEl.textContent = 'Game started! Guess the number!';
  startTimer();
});

// ===== Voice Input =====
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
function startVoice(){
  if(!SpeechRecognition){alert('Voice not supported'); return;}
  if(player.recog){player.recog.stop(); player.recog=null; return;}
  player.recog=new SpeechRecognition();
  player.recog.lang='en-US';
  player.recog.continuous=true;
  player.recog.onstart=()=>{player.micEl.classList.add('listening'); messageEl.textContent=`Listening...`;}
  player.recog.onend=()=>{player.micEl.classList.remove('listening'); player.recog=null;}
  player.recog.onresult=ev=>{
    const spoken=ev.results[ev.results.length-1][0].transcript.trim();
    const num=extractNumber(spoken);
    if(num){ 
      document.getElementById('p1Input').value=num;
      submitGuess();
    } else {
      messageEl.textContent=`Could not detect number`;
    }
  };
  player.recog.start();
}

// ===== Parse Spoken Numbers =====
function extractNumber(s){
  const digits=s.match(/\d+/); if(digits) return Number(digits[0]);
  return null;
}

// ===== Initialize =====
resetGame();
updateLeaderboard();