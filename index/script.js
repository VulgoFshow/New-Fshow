<script>
function scrollCarrossel(direction) {
  const carrossel = document.getElementById('carrossel');
  const scrollAmount = 350; 
  carrossel.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}
</script>

<script>
const pfBtn = document.getElementById("pfBtn");
const pfMenu = document.getElementById("pfMenu");

pfBtn.addEventListener("click", (e) => {
  e.stopPropagation(); 
  pfMenu.classList.toggle("active");
});

document.addEventListener("click", (e) => {
  if (!pfMenu.contains(e.target) && !pfBtn.contains(e.target)) {
    pfMenu.classList.remove("active");
  }
});
</script>
