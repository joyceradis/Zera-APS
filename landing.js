const examples = document.querySelector(".samples");
const choices = examples.querySelectorAll("[data-example]");

examples.hidden = false;
for (const choice of choices) {
  choice.addEventListener("click", () => {
    for (const button of choices) {
      const selected = button === choice;
      button.setAttribute("aria-pressed", String(selected));
      document.getElementById(button.dataset.example).hidden = !selected;
    }
  });
}
