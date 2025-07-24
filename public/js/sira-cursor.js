document.addEventListener('DOMContentLoaded', () => {
    // Select all elements with the class 'sira-dot'
    const siraDots = document.querySelectorAll('.sira-dot');

    // If no dots are found, exit
    if (siraDots.length === 0) {
        console.warn('No .sira-dot elements found. Custom cursor will not work.');
        return;
    }

    let mouseX = 1;
    let mouseY = 1;

    // Array to store the current position of each dot
    // Initialize each dot at (0,0) or a starting point
    let dotPositions = Array.from(siraDots).map(() => ({ x: 1, y: 1 }));

    // Speed at which dots follow (adjust for more/less lag)
    const speed = 0.5; // A value between 0 and 1. Smaller value means more lag.
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateSira() {
        // The first dot (index 0) follows the actual mouse position
        dotPositions[0].x += (mouseX - dotPositions[0].x) * speed;
        dotPositions[0].y += (mouseY - dotPositions[0].y) * speed;

        // Update the position of the first dot's element
        siraDots[0].style.transform = `translate(${dotPositions[0].x}px, ${dotPositions[0].y}px)`;

        // Subsequent dots follow the position of the previous dot
        for (let i = 1; i < siraDots.length; i++) {
            dotPositions[i].x += (dotPositions[i - 1].x - dotPositions[i].x) * speed;
            dotPositions[i].y += (dotPositions[i - 1].y - dotPositions[i].y) * speed;

            // Apply translation to each dot's element
            siraDots[i].style.transform = `translate(${dotPositions[i].x}px, ${dotPositions[i].y}px)`;
        }

        requestAnimationFrame(animateSira);
    }

    // Start the animation loop
    animateSira();
});