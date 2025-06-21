const app = document.getElementById("app");

if (app) {
  // Create a new div element
  const newDiv = document.createElement("div");

  // Set the content of the new div
  newDiv.innerHTML = "<h1>Remote Micro App</h1>";

  // Append the new div to the app element
  app.appendChild(newDiv);
}
