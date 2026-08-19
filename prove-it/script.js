document.addEventListener("DOMContentLoaded", () => {
    const proveItForm = document.getElementById("prove-it-form");
    const proveItMsg = document.getElementById("prove-it-message");
    const passInput = document.getElementById("passphrase");
    let failCount = 0;

    proveItForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = passInput.value.trim();
        if (!val) return;

        failCount++;
        passInput.value = "";

        if (failCount > 3) {
            // Trigger Easter Egg logic
            passInput.disabled = true;
            proveItForm.style.display = "none"; // Input completely disappears
            proveItMsg.classList.add("loud"); // Message gets loud & Emerald Green

            let dots = 0;
            const phases = ["verifying...", "checking...", "decrypting..."];
            proveItMsg.textContent = phases[0];

            const loader = setInterval(() => {
                dots++;
                proveItMsg.textContent = phases[dots % phases.length];
            }, 400);

            setTimeout(() => {
                clearInterval(loader);

                // The "lol no." overrides the green with the primary crimson accent
                proveItMsg.textContent = "lol no.";
                proveItMsg.style.animation = "none"; // Stop pulsing
                proveItMsg.style.color = "var(--accent)";

                // Stay on page, give the textbox back
                setTimeout(() => {
                    proveItForm.style.display = "flex"; // Bring back input box
                    passInput.disabled = false;
                    passInput.value = "";
                    failCount = 0;
                    proveItMsg.classList.remove("loud");
                    proveItMsg.textContent = "";

                    // Reset manual inline styles to allow future animations
                    proveItMsg.style.animation = "";
                    proveItMsg.style.color = "";

                    passInput.focus();
                }, 2000);
            }, 2500);
        } else {
            proveItMsg.textContent = "nope. try again.";
        }
    });
});
