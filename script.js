// script.js
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".product");

  items.forEach(item => {
    item.addEventListener("click", () => {
      const titleEl = item.querySelector("h2, h3, p");
      const title = titleEl ? titleEl.textContent.trim() : "Товар";
      alert("Вы выбрали: " + title);
    });
  });
}); 
