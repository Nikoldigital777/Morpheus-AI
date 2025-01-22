
document.addEventListener('DOMContentLoaded', () => {
    const redPill = document.getElementById('red-pill-btn');
    const bluePill = document.getElementById('blue-pill-btn');
    const mainQuestion = document.getElementById('main-question');

    function transitionToChat() {
        document.body.style.transition = 'opacity 1s ease-in-out';
        document.body.style.opacity = 0;
        setTimeout(() => {
            window.location.href = '/chat';
        }, 1000);
    }

    function handleRedPill() {
        transitionToChat();
    }

    function handleBluePill() {
        confirmBluePill().then(confirmed => {
            if (confirmed) {
                document.body.style.transition = 'opacity 1s ease-in-out';
                document.body.style.opacity = 0;
                setTimeout(() => {
                    window.location.href = 'https://google.com';
                }, 1000);
            } else {
                transitionToChat();
            }
        });
    }

    function confirmBluePill() {
        return new Promise((resolve) => {
            mainQuestion.textContent = "Are you sure you want to stay asleep?";
            bluePill.textContent = "Yes, I'm sure";
            redPill.textContent = "No, wake me up";

            function handleChoice(choice) {
                redPill.removeEventListener('click', chooseRed);
                bluePill.removeEventListener('click', chooseBlue);
                resolve(choice);
            }

            function chooseRed() {
                handleChoice(false);
            }

            function chooseBlue() {
                handleChoice(true);
            }

            redPill.addEventListener('click', chooseRed);
            bluePill.addEventListener('click', chooseBlue);
        });
    }

    redPill.addEventListener('click', handleRedPill);
    bluePill.addEventListener('click', handleBluePill);
});
