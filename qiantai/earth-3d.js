// 地球动态效果 - 原地慢速旋转 + 呼吸脉冲
(function(){
    function init(){
        const container = document.querySelector('.earth-canvas');
        if(!container) return;

        // 清空容器
            container.innerHTML = '';

        // 创建包装器（左对齐）
        const wrapper = document.createElement('div');
        wrapper.id = 'earth-wrapper';
        wrapper.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            position: relative;
            overflow: visible;
        `;

        // 创建地球图片
        const earthImg = document.createElement('img');
        earthImg.id = 'earth-img';
        earthImg.src = 'img/bf79c28fde8899710305fbc94b48b1c9.png';
        earthImg.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center 35%;
            display: block;
            animation: earthRotate 60s linear infinite, earthPulse 9s ease-in-out infinite;
            filter: brightness(0.75) drop-shadow(0 4px 20px rgba(0, 150, 255, 0.25));
            position: relative;
        `;

        wrapper.appendChild(earthImg);
        container.appendChild(wrapper);

        // 添加CSS动画
        if(!document.getElementById('earth-animation-style')){
            const style = document.createElement('style');
            style.id = 'earth-animation-style';
            style.textContent = `
                /* 原地慢速旋转 - 60秒一圈 */
                @keyframes earthRotate {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                /* 呼吸脉冲 - 9秒周期 */
                @keyframes earthPulse {
                    0%, 100% {
                        opacity: 0.95;
            }
                    50% {
                        opacity: 1;
                    }
                }

                #earth-wrapper {
                    filter: drop-shadow(0 6px 25px rgba(0, 130, 200, 0.2));
                }
            `;
            document.head.appendChild(style);
        }
        }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }
})();
