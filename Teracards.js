function openInvitation(){

document.getElementById("envelope-screen").style.display="none";

document.getElementById("invitation").style.display="block";

window.scrollTo(0,0);

}

const weddingDate = new Date("June 14, 2026 16:00:00").getTime();

const countdown = setInterval(function(){

const now = new Date().getTime();

const distance = weddingDate - now;

const days = Math.floor(distance / (1000*60*60*24));

const hours = Math.floor(
(distance % (1000*60*60*24))
/
(1000*60*60)
);

const minutes = Math.floor(
(distance % (1000*60*60))
/
(1000*60)
);

const seconds = Math.floor(
(distance % (1000*60))
/
1000
);

document.getElementById("countdown").innerHTML =
  days + " Days " +
  hours + " Hours " +
  minutes + " Minutes " +
  seconds + " Seconds";

},1000);

function sendRSVP(){

const name =
document.getElementById("name").value;

const phone =
document.getElementById("phone").value;

const guests =
document.getElementById("guests").value;

const message =
document.getElementById("message").value;

const text =
`Wedding RSVP

Name: ${name}

Phone: ${phone}

Guests: ${guests}

Message: ${message}

Regards.`;

const url =
`https://wa.me/255788681422?text=${encodeURIComponent(text)}`;

window.open(url,'_blank');

}
const images = [
"images/1.png",
"images/2.png",
"images/3.png",
"images/4.png",
];

let current = 0;

const slideshow =
document.querySelector(".slideshow-bg");

function changeBackground(){

slideshow.style.backgroundImage =
`url('${images[current]}')`;

current++;

if(current >= images.length){
current = 0;
}

}

changeBackground();

setInterval(changeBackground,5000);