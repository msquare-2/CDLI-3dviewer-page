function openSlideMenu() {
  document.getElementById("side-menu").classList.remove("d-none")
  if (window.innerWidth < 600)
    document.getElementById("side-menu").style.width = "100%";
  else document.getElementById("side-menu").style.width = "25rem";
  document.getElementById("faded-bg").classList.remove("d-none");
}

function closeSlideMenu() {
  document.getElementById("side-menu").classList.add("d-none")
  document.getElementById("faded-bg").classList.add("d-none");
  document.getElementById("side-menu").style.width = "0";
}
