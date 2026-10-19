document.querySelector("#current-year").textContent = String(new Date().getFullYear());

const typewriter = document.querySelector(".hero-typewriter");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (typewriter && !prefersReducedMotion) {
	const segments = Array.from(typewriter.querySelectorAll("[data-typewriter]"));
	const characters = segments.map((segment) => Array.from(segment.textContent));
	const characterDelay = 55;
	const segmentPause = 120;
	const typingDuration = characters.reduce((duration, segment) => duration + segment.length * characterDelay, 0)
		+ (segments.length - 1) * segmentPause;
	const typingStartedAt = performance.now() + 500;

	segments.forEach((segment) => {
		segment.textContent = "";
	});
	typewriter.classList.add("is-typing");

	const updateTypewriter = () => {
		let elapsed = Math.max(0, performance.now() - typingStartedAt);
		characters.forEach((segmentCharacters, index) => {
			const visibleCharacters = Math.max(0, Math.min(segmentCharacters.length, Math.floor(elapsed / characterDelay)));
			segments[index].textContent = segmentCharacters.slice(0, visibleCharacters).join("");
			elapsed -= segmentCharacters.length * characterDelay + (index < segments.length - 1 ? segmentPause : 0);
		});

		if (performance.now() - typingStartedAt >= typingDuration) {
			typewriter.classList.remove("is-typing");
			return;
		}
		window.setTimeout(updateTypewriter, 30);
	};

	window.setTimeout(updateTypewriter, 500);
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