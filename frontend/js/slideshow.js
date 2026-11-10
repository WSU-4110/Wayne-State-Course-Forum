
document.addEventListener("DOMContentLoaded", () => {
  const slideshow = document.querySelector(".hero-slideshow");
  if (!slideshow) return;

  const slides = slideshow.querySelectorAll(".slide");
  const indicators = slideshow.querySelectorAll(".indicator");
  const previousButton = slideshow.querySelector(".previous");
  const nextButton = slideshow.querySelector(".next");

  if (!slides.length) return;

  let currentSlide = 0;
  let timer;

  function showSlide(index) {
    currentSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === currentSlide);
    });

    indicators.forEach((indicator, i) => {
      indicator.classList.toggle("active", i === currentSlide);
      indicator.setAttribute(
        "aria-pressed",
        String(i === currentSlide)
      );
    });
  }

  function startSlideshow() {
    clearInterval(timer);
    timer = setInterval(() => {
      showSlide(currentSlide + 1);
    }, 5000);
  }

  previousButton?.addEventListener("click", () => {
    showSlide(currentSlide - 1);
    startSlideshow();
  });

  nextButton?.addEventListener("click", () => {
    showSlide(currentSlide + 1);
    startSlideshow();
  });

  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      showSlide(index);
      startSlideshow();
    });
  });

  showSlide(0);
  startSlideshow();
});
