document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('bgVideo');
    const slides = document.querySelectorAll('.slide');
    const distCounter = document.getElementById('distCounter');
    const scrollCont = document.getElementById('scrollContainer');

    let videoDuration = 0;
    let isSeeking = false;
    let pendingSeek = null;
    let counterDone = false;

    let targetScroll = 0;
    let currentScroll = 0;

    const slideData = Array.from(slides).map((slide, index) => {
        const start = parseFloat(slide.dataset.start);
        const end = parseFloat(slide.dataset.end);
        return {
            el: slide,
            index,
            start,
            end
        };
    });

    if (video) {
        video.addEventListener('loadedmetadata', () => {
            videoDuration = video.duration;
            video.currentTime = 0;
        });

        video.addEventListener('seeked', () => {
            isSeeking = false;
            if (pendingSeek !== null) {
                const next = pendingSeek;
                pendingSeek = null;
                requestVideoSeek(next);
            }
        });

        if (video.readyState >= 1) {
            videoDuration = video.duration;
        }
    }

    function requestVideoSeek(targetTime) {
        if (!video || !videoDuration || isNaN(targetTime)) return;
        const clamped = Math.max(0, Math.min(targetTime, videoDuration));

        if (isSeeking) {
            pendingSeek = clamped;
            return;
        }

        if (Math.abs(video.currentTime - clamped) > 0.02) {
            isSeeking = true;
            if ('fastSeek' in video) {
                try {
                    video.fastSeek(clamped);
                } catch (e) {
                    video.currentTime = clamped;
                }
            } else {
                video.currentTime = clamped;
            }
        }
    }

    function onScroll() {
        const max = scrollCont.scrollHeight - window.innerHeight;
        targetScroll = max > 0 ? Math.max(0, Math.min(window.scrollY / max, 1)) : 0;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    function animateNumber(el, start, end, duration) {
        if (!el) return;
        let startTs = null;
        function step(ts) {
            if (!startTs) startTs = ts;
            const progress = Math.min((ts - startTs) / duration, 1);
            const val = Math.round(start + (end - start) * (1 - Math.pow(1 - progress, 3)));
            el.textContent = val.toLocaleString('tr-TR');
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function update() {
        requestAnimationFrame(update);

        const diff = targetScroll - currentScroll;
        if (Math.abs(diff) > 0.0001) {
            currentScroll += diff * 0.14;
        } else {
            currentScroll = targetScroll;
        }

        if (videoDuration > 0) {
            requestVideoSeek(currentScroll * videoDuration);
        }

        for (let i = 0; i < slideData.length; i++) {
            const item = slideData[i];
            const active = currentScroll >= item.start && currentScroll <= item.end;
            
            if (active) {
                item.el.style.opacity = '1';
                item.el.style.transform = 'translateY(0)';
                item.el.style.pointerEvents = 'auto';
            } else {
                item.el.style.opacity = '0';
                item.el.style.transform = 'translateY(18px)';
                item.el.style.pointerEvents = 'none';
            }
        }

        if (!counterDone && currentScroll >= 0.25 && currentScroll <= 0.40) {
            counterDone = true;
            animateNumber(distCounter, 0, 1600, 1400);
        } else if (counterDone && (currentScroll < 0.22 || currentScroll > 0.42)) {
            counterDone = false;
            if (distCounter) distCounter.textContent = '0';
        }
    }

    requestAnimationFrame(update);
});
