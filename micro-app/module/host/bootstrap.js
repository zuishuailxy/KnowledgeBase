import("remote/addList").then((module) => {
  const app = document.getElementById("app");

  if (app) {
    // Create a new div element
    const newDiv = document.createElement("div");

    // Set the content of the new div
    newDiv.innerHTML = "<h1>Host app</h1>";

    // Append the new div to the app element
    app.appendChild(newDiv);
  }
  // Call the addList function from the remote module
  module.addList();
});
