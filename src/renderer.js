const closeButton = document.getElementById('close-button');

// close on X button
closeButton.addEventListener('click', () => {
  console.log('close button clicked');
  api.closeWindow();
});

// close on lost focus
window.addEventListener('blur', () => {
  console.log('window lost focus');
  api.closeWindow();
});
