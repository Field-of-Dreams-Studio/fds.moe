function initMemberViewer(viewer) {
    const memberLinks = Array.from(viewer.querySelectorAll(".member-link[data-profile]"));
    const memberPanel = viewer.querySelector(".member-panel");

    if (!memberLinks.length || !memberPanel) {
        return;
    }

    const profileBase = viewer.dataset.profileBase || "profiles";
    const syncHash = viewer.dataset.syncHash === "true";
    const profiles = new Set(memberLinks.map((link) => link.dataset.profile));
    let currentProfile = "";
    let requestId = 0;

    async function loadMember(profileName, updateHash) {
        if (!profiles.has(profileName)) {
            return;
        }

        currentProfile = profileName;
        requestId += 1;
        const activeRequest = requestId;

        memberLinks.forEach((link) => {
            const isCurrent = link.dataset.profile === profileName;
            link.classList.toggle("current", isCurrent);
            link.setAttribute("aria-pressed", isCurrent ? "true" : "false");
        });

        memberPanel.innerHTML = '<p class="member-loading">Loading member archive...</p>';

        try {
            const response = await fetch(`${profileBase}/${profileName}.html`);

            if (!response.ok) {
                throw new Error(`Failed to load ${profileName}`);
            }

            const markup = await response.text();

            if (activeRequest !== requestId) {
                return;
            }

            memberPanel.innerHTML = markup;

            if (syncHash && updateHash) {
                window.location.hash = profileName;
            }
        } catch (error) {
            if (activeRequest !== requestId) {
                return;
            }

            memberPanel.innerHTML = '<p class="member-loading">Unable to load this member archive right now.</p>';
            console.error(error);
        }
    }

    function getInitialProfile() {
        if (syncHash) {
            const hashProfile = window.location.hash.replace(/^#/, "");

            if (profiles.has(hashProfile)) {
                return hashProfile;
            }
        }

        return memberLinks[0]?.dataset.profile;
    }

    memberLinks.forEach((link) => {
        link.addEventListener("click", () => {
            const profileName = link.dataset.profile;

            if (profileName && profileName !== currentProfile) {
                loadMember(profileName, true);
            }
        });
    });

    if (syncHash) {
        window.addEventListener("hashchange", () => {
            const profileName = getInitialProfile();

            if (profileName && profileName !== currentProfile) {
                loadMember(profileName, false);
            }
        });
    }

    const initialProfile = getInitialProfile();

    if (initialProfile) {
        loadMember(initialProfile, false);
    }
}

document.querySelectorAll(".member-archive-viewer").forEach(initMemberViewer);
