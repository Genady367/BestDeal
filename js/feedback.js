const backBtn = document.getElementById("backToList");
const storeSelect = document.getElementById("store");
const commentField = document.getElementById("comment");
const submitBtn = document.getElementById("submitFeedback");

backBtn.addEventListener("click", () => {
  document.getElementById("feedbackScreen").style.display = "none";
  document.getElementById("shoppingScreen").style.display = "block";
});

submitBtn.addEventListener("click", () => {
  const store = storeSelect.value;
  const comment = commentField.value.trim();

  if (!comment) {
    alert("Please enter a comment before submitting.");
    return;
  }

  console.log("Feedback submitted:", { store, comment });

  alert("Thank you for your feedback!");
  commentField.value = "";
});