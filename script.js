document.querySelector("#current-year").textContent = String(new Date().getFullYear());

const typewriter = document.querySelector(".hero-typewriter");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const soundToggle = document.querySelector(".sound-toggle");
let soundEnabled = false;
let soundContext;
let stopAmbientMusic;

const playTone = ({ frequency, endFrequency = frequency, duration, volume, type = "sine", startAt = 0 }) => {
	if (!soundEnabled || !soundContext) return;

	const oscillator = soundContext.createOscillator();
	const gain = soundContext.createGain();
	const startTime = soundContext.currentTime + startAt;
	const endTime = startTime + duration;
	oscillator.type = type;
	oscillator.frequency.setValueAtTime(frequency, startTime);
	oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), endTime);
	gain.gain.setValueAtTime(0.0001, startTime);
	gain.gain.exponentialRampToValueAtTime(volume, startTime + Math.min(0.008, duration / 3));
	gain.gain.exponentialRampToValueAtTime(0.0001, endTime);
	oscillator.connect(gain);
	gain.connect(soundContext.destination);
	oscillator.start(startTime);
	oscillator.stop(endTime);
};

const playSound = (sound) => {
	if (!soundEnabled || !soundContext) return;

	if (sound === "type") {
		playTone({ frequency: 1250, endFrequency: 970, duration: 0.024, volume: 0.045, type: "square" });
	} else if (sound === "click") {
		playTone({ frequency: 1050, endFrequency: 720, duration: 0.055, volume: 0.09, type: "triangle" });
	} else if (sound === "scan") {
		playTone({ frequency: 360, endFrequency: 960, duration: 0.3, volume: 0.065, type: "sine" });
	} else if (sound === "glitch") {
		playTone({ frequency: 760, endFrequency: 140, duration: 0.08, volume: 0.085, type: "sawtooth" });
		playTone({ frequency: 210, endFrequency: 620, duration: 0.11, volume: 0.065, type: "square", startAt: 0.045 });
	} else if (sound === "grant") {
		playTone({ frequency: 660, duration: 0.18, volume: 0.09, type: "sine" });
		playTone({ frequency: 880, duration: 0.24, volume: 0.09, type: "sine", startAt: 0.11 });
	}
};

const startAmbientMusic = () => {
	const musicGain = soundContext.createGain();
	const oscillators = [];
	const progression = [
		[146.83, 220, 261.63, 329.63],
		[130.81, 196, 246.94, 329.63],
		[116.54, 174.61, 220, 293.66],
		[87.31, 174.61, 220, 261.63]
	];
	let chordIndex = 0;

	musicGain.gain.setValueAtTime(0.0001, soundContext.currentTime);
	musicGain.gain.exponentialRampToValueAtTime(0.2, soundContext.currentTime + 2);
	musicGain.connect(soundContext.destination);

	progression[0].forEach((frequency, index) => {
		const voiceGain = soundContext.createGain();
		voiceGain.gain.value = index === 0 ? 0.18 : 0.12;
		voiceGain.connect(musicGain);

		[frequency - 0.7, frequency + 0.7].forEach((detunedFrequency) => {
			const oscillator = soundContext.createOscillator();
			oscillator.type = "sine";
			oscillator.frequency.value = detunedFrequency;
			oscillator.connect(voiceGain);
			oscillator.start();
			oscillators.push(oscillator);
		});
	});

	const progressionTimer = window.setInterval(() => {
		chordIndex = (chordIndex + 1) % progression.length;
		const startTime = soundContext.currentTime;
		progression[chordIndex].forEach((frequency, index) => {
			const voiceOscillators = oscillators.slice(index * 2, index * 2 + 2);
			voiceOscillators.forEach((oscillator, voiceIndex) => {
				oscillator.frequency.setTargetAtTime(frequency + (voiceIndex === 0 ? -0.7 : 0.7), startTime, 1.8);
			});
		});
	}, 8000);

	return () => {
		window.clearInterval(progressionTimer);
		const stopTime = soundContext.currentTime + 0.7;
		musicGain.gain.cancelScheduledValues(soundContext.currentTime);
		musicGain.gain.setTargetAtTime(0.0001, soundContext.currentTime, 0.12);
		oscillators.forEach((oscillator) => oscillator.stop(stopTime));
	};
};

const enableSound = () => {
	if (soundEnabled || !soundContext || soundContext.state !== "running") return false;

	soundEnabled = true;
	stopAmbientMusic = startAmbientMusic();
	soundToggle.textContent = "Music: ON";
	soundToggle.setAttribute("aria-label", "Turn background music and sound effects off");
	soundToggle.setAttribute("aria-pressed", "true");
	playSound("grant");
	return true;
};

const startSound = () => {
	if (soundEnabled) return Promise.resolve(true);
	if (!window.AudioContext) {
		soundToggle.textContent = "Music unavailable";
		soundToggle.setAttribute("aria-label", "Background music is unavailable in this browser");
		return Promise.resolve(false);
	}

	soundContext = soundContext?.state === "closed" ? undefined : soundContext;
	soundContext ??= new AudioContext();
	return soundContext.resume()
		.then(() => enableSound())
		.catch((error) => {
			console.error("Unable to start portfolio music.", error);
			return false;
		});
};

const updateSoundToggle = (enabled) => {
	soundEnabled = enabled;
	soundToggle.textContent = enabled ? "Music: ON" : "Music: OFF";
	soundToggle.setAttribute("aria-label", enabled
		? "Turn background music and sound effects off"
		: "Turn background music and sound effects on");
	soundToggle.setAttribute("aria-pressed", String(enabled));
};

const unlockMusicOnInteraction = (event) => {
	if (event.target.closest(".sound-toggle")) return;
	void startSound();
};

document.addEventListener("pointerdown", unlockMusicOnInteraction, { capture: true });
document.addEventListener("keydown", unlockMusicOnInteraction, { capture: true });

const attemptAutoplay = () => {
	if (!window.AudioContext) {
		soundToggle.textContent = "Music unavailable";
		soundToggle.setAttribute("aria-label", "Background music is unavailable in this browser");
		return;
	}

	soundContext = new AudioContext();
	soundContext.resume()
		.then(() => enableSound())
		.catch((error) => {
			if (error.name !== "NotAllowedError") console.error("Unable to autoplay portfolio music.", error);
		});
	if (soundContext.state !== "running") {
		soundToggle.textContent = "Music: CLICK TO START";
	}
};

soundToggle.addEventListener("click", async () => {
	if (!soundEnabled) {
		await startSound();
		return;
	}

	updateSoundToggle(false);
	stopAmbientMusic();
	stopAmbientMusic = undefined;
	const contextToClose = soundContext;
	window.setTimeout(() => void contextToClose.close(), 700);
	soundContext = undefined;
});

attemptAutoplay();

document.addEventListener("click", (event) => {
	const target = event.target.closest("a, button");
	if (!target || target === soundToggle) return;

	if (target.matches("[data-open-medibox], [data-open-coohom]")) {
		playSound("glitch");
	} else if (!target.matches(".dialog-close, .coohom-dialog-close, .send-button")) {
		playSound("click");
	}
});

if (typewriter && !prefersReducedMotion) {
	const segments = Array.from(typewriter.querySelectorAll("[data-typewriter]"));
	const characters = segments.map((segment) => Array.from(segment.textContent));
	const characterDelay = 55;
	const segmentPause = 120;
	let previousVisibleCharacters = 0;
	const typingDuration = characters.reduce((duration, segment) => duration + segment.length * characterDelay, 0)
		+ (segments.length - 1) * segmentPause;
	const typingStartedAt = performance.now() + 500;

	segments.forEach((segment) => {
		segment.textContent = "";
	});
	typewriter.classList.add("is-typing");

	const updateTypewriter = () => {
		let elapsed = Math.max(0, performance.now() - typingStartedAt);
		let visibleCharacterCount = 0;
		characters.forEach((segmentCharacters, index) => {
			const visibleCharacters = Math.max(0, Math.min(segmentCharacters.length, Math.floor(elapsed / characterDelay)));
			segments[index].textContent = segmentCharacters.slice(0, visibleCharacters).join("");
			visibleCharacterCount += visibleCharacters;
			elapsed -= segmentCharacters.length * characterDelay + (index < segments.length - 1 ? segmentPause : 0);
		});
		if (visibleCharacterCount > previousVisibleCharacters) playSound("type");
		previousVisibleCharacters = visibleCharacterCount;

		if (performance.now() - typingStartedAt >= typingDuration) {
			typewriter.classList.remove("is-typing");
			return;
		}
		window.setTimeout(updateTypewriter, 30);
	};

	window.setTimeout(updateTypewriter, 500);
}

const revealSections = document.querySelectorAll(".section");
if ("IntersectionObserver" in window) {
	const sectionObserver = new IntersectionObserver((entries, observer) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) return;
			entry.target.classList.add("is-revealed");
			playSound("scan");
			observer.unobserve(entry.target);
		});
	}, { threshold: 0.12 });

	revealSections.forEach((section) => {
		section.classList.add("is-reveal-pending");
		sectionObserver.observe(section);
	});
} else {
	revealSections.forEach((section) => section.classList.add("is-revealed"));
}

const deterministicRandom = (seed) => {
	const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
	return value - Math.floor(value);
};

document.querySelectorAll(".space-stars").forEach((layer, layerIndex) => {
	for (let starIndex = 0; starIndex < 200; starIndex += 1) {
		const seed = layerIndex * 200 + starIndex + 1;
		const star = document.createElement("span");
		const sizeRoll = deterministicRandom(seed + 3);
		const size = sizeRoll > 0.994
			? 2.8 + deterministicRandom(seed + 4) * 1.2
			: sizeRoll > 0.94
				? 1.6 + deterministicRandom(seed + 5) * 0.8
				: 0.65 + deterministicRandom(seed + 6) * 0.85;
		const colorRoll = deterministicRandom(seed + 7);
		const starX = deterministicRandom(seed + 1) * 100;
		const starY = deterministicRandom(seed + 11) < 0.64
			? (78 - starX * 0.57 + (deterministicRandom(seed + 2) - 0.5) * 30 + 100) % 100
			: deterministicRandom(seed + 2) * 100;
		const colorClass = colorRoll < 0.17 ? "space-star-blue" : colorRoll > 0.9 ? "space-star-warm" : "space-star-white";

		star.className = `space-star ${colorClass}`;
		star.style.setProperty("--star-x", `${starX}%`);
		star.style.setProperty("--star-y", `${starY}%`);
		star.style.setProperty("--star-size", `${size}px`);
		star.style.setProperty("--star-opacity", `${0.42 + deterministicRandom(seed + 8) * 0.5}`);
		star.style.setProperty("--twinkle-delay", `${-deterministicRandom(seed + 9) * 8}s`);
		star.style.setProperty("--twinkle-duration", `${3 + deterministicRandom(seed + 10) * 7}s`);
		layer.append(star);
	}
});

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

menuToggle.addEventListener("click", () => {
	const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
	menuToggle.setAttribute("aria-expanded", String(!isOpen));
	menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
	siteNav.classList.toggle("is-open", !isOpen);
});

siteNav.querySelectorAll("a").forEach((link) => {
	link.addEventListener("click", () => {
		menuToggle.setAttribute("aria-expanded", "false");
		menuToggle.setAttribute("aria-label", "Open navigation");
		siteNav.classList.remove("is-open");
	});
});

const skillFilters = document.querySelectorAll(".skill-filter");
const skillItems = document.querySelectorAll(".skill-item");

skillFilters.forEach((button) => {
	button.addEventListener("click", () => {
		const filter = button.dataset.filter;
		skillFilters.forEach((item) => {
			const isActive = item === button;
			item.classList.toggle("is-active", isActive);
			item.setAttribute("aria-pressed", String(isActive));
		});
		skillItems.forEach((item) => {
			item.hidden = filter !== "all" && item.dataset.category !== filter;
		});
	});
});

document.querySelector("#contact-form").addEventListener("submit", (event) => {
	event.preventDefault();
	playSound("grant");
	const formData = new FormData(event.currentTarget);
	const subject = encodeURIComponent(formData.get("subject"));
	const message = encodeURIComponent(`From: ${formData.get("name")} (${formData.get("email")})\n\n${formData.get("message")}`);
	window.location.href = `mailto:lexterbalitorespero@gmail.com?subject=${subject}&body=${message}`;
});

const mediboxDialog = document.querySelector("#medibox-dialog");
const mediboxPhoto = document.querySelector(".medibox-photo");
const photoUnavailable = document.querySelector(".photo-unavailable");

document.querySelectorAll("[data-open-medibox]").forEach((trigger) => {
	trigger.addEventListener("click", () => mediboxDialog.showModal());
});

document.querySelector(".dialog-close").addEventListener("click", () => mediboxDialog.close());
mediboxDialog.addEventListener("close", () => playSound("click"));
mediboxDialog.addEventListener("click", (event) => {
	if (event.target === mediboxDialog) mediboxDialog.close();
});

const updatePhotoAvailability = () => {
	const hasPhoto = mediboxPhoto.naturalWidth > 0;
	mediboxPhoto.hidden = !hasPhoto;
	photoUnavailable.hidden = hasPhoto;
};

mediboxPhoto.addEventListener("load", updatePhotoAvailability);
mediboxPhoto.addEventListener("error", updatePhotoAvailability);
if (mediboxPhoto.complete) updatePhotoAvailability();

const coohomDialog = document.querySelector("#coohom-dialog");
const coohomCoverImage = document.querySelector(".coohom-cover-image");
const coohomCoverFallback = document.querySelector(".coohom-cover-fallback");

document.querySelectorAll("[data-open-coohom]").forEach((trigger) => {
	trigger.addEventListener("click", () => coohomDialog.showModal());
});

document.querySelector(".coohom-dialog-close").addEventListener("click", () => coohomDialog.close());
coohomDialog.addEventListener("close", () => playSound("click"));
coohomDialog.addEventListener("click", (event) => {
	if (event.target === coohomDialog) coohomDialog.close();
});

document.querySelectorAll(".coohom-photo").forEach((photo) => {
	const missingMessage = photo.parentElement.querySelector(".coohom-photo-missing");
	const updatePhotoAvailability = () => {
		const hasPhoto = photo.naturalWidth > 0;
		photo.hidden = !hasPhoto;
		missingMessage.hidden = hasPhoto;
	};

	photo.addEventListener("load", updatePhotoAvailability);
	photo.addEventListener("error", updatePhotoAvailability);
	if (photo.complete) updatePhotoAvailability();
});

const updateCoohomCover = () => {
	const hasPhoto = coohomCoverImage.naturalWidth > 0;
	coohomCoverImage.hidden = !hasPhoto;
	coohomCoverFallback.hidden = hasPhoto;
};

coohomCoverImage.addEventListener("load", updateCoohomCover);
coohomCoverImage.addEventListener("error", updateCoohomCover);
if (coohomCoverImage.complete) updateCoohomCover();

const icctskolarLogo = document.querySelector(".icctskolar-logo");
const icctskolarFallback = document.querySelector(".icctskolar-cover-fallback");
const updateIcctskolarCover = () => {
	const hasLogo = icctskolarLogo.naturalWidth > 0;
	icctskolarLogo.hidden = !hasLogo;
	icctskolarFallback.hidden = hasLogo;
};

icctskolarLogo.addEventListener("load", updateIcctskolarCover);
icctskolarLogo.addEventListener("error", updateIcctskolarCover);
if (icctskolarLogo.complete) updateIcctskolarCover();