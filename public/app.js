
const $ = s => document.querySelector(s);
const toast = msg => { const t=$("#toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),3200); };

$("#menuBtn").addEventListener("click",()=>$("#navlinks").classList.toggle("mobile-open"));
document.querySelectorAll("#navlinks a").forEach(a=>a.addEventListener("click",()=>$("#navlinks").classList.remove("mobile-open")));

const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
$("#date").min = today.toISOString().slice(0,10);

$("#searchForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const params = new URLSearchParams({from:$("#from").value,to:$("#to").value,date:$("#date").value});
  try{
    const r=await fetch(`/api/flights/search?${params}`);
    const data=await r.json();
    if(!r.ok) throw new Error(data.error);
    if(!data.results.length){ toast(data.message || "No flights found."); return; }
    const f=data.results[0];
    $("#flightResults").innerHTML = `<div class="card" style="margin-top:15px;background:#f5f8fc"><strong>${f.flightNo} • ${f.from} → ${f.to}</strong><p style="margin:5px 0">${f.depart} — ${f.arrive} · ${f.duration} · ${f.aircraft}</p><strong>From ${f.currency} ${f.fare}</strong><p style="margin:4px 0;color:#617089">${f.seatsLeft} seats remaining</p></div>`;
    $("#flightNo").value=f.flightNo; $("#bookFrom").value=f.from; $("#bookTo").value=f.to; $("#bookDate").value=f.date;
    openBooking();
  }catch(err){ toast(err.message || "Unable to search flights."); }
});

function openBooking(){ $("#bookingModal").classList.add("open"); }
function closeBooking(){ $("#bookingModal").classList.remove("open"); }
window.openBooking=openBooking; window.closeBooking=closeBooking;

$("#bookingForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const body=Object.fromEntries(new FormData(e.target).entries());
  try{
    const r=await fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const data=await r.json();
    if(!r.ok) throw new Error(data.error);
    $("#flightResults").innerHTML=`<div class="card" style="background:#eaf8ef;border-color:#b9e5c8"><h3>Booking confirmed</h3><p>Your reference is <strong>${data.booking.reference}</strong>.</p><p>${data.booking.from} → ${data.booking.to} on ${data.booking.date}.</p></div>`;
    e.target.style.display="none";
    toast("Booking confirmed.");
  }catch(err){ toast(err.message || "Booking failed."); }
});

$("#contactForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const body=Object.fromEntries(new FormData(e.target).entries());
  const r=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data=await r.json();
  if(!r.ok) return toast(data.error || "Unable to send message.");
  e.target.reset(); toast(data.message);
});

$("#newsletterForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const body=Object.fromEntries(new FormData(e.target).entries());
  const r=await fetch("/api/newsletter",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data=await r.json();
  if(!r.ok) return toast(data.error || "Unable to subscribe.");
  e.target.reset(); toast(data.message);
});

$("#bookingModal").addEventListener("click",e=>{if(e.target.id==="bookingModal")closeBooking()});
