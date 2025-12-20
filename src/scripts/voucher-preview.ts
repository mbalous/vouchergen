import * as PIXI from 'pixi.js';

export function setupVoucherPreview() {
    // Elements
    const bgUpload = document.getElementById('bg-upload') as HTMLInputElement;
    const previewContainer = document.getElementById('voucher-preview');
    const downloadBtn = document.getElementById('download-btn');
    const regenerateCodeBtn = document.getElementById('regenerate-code-btn');
    
    const inputs = {
        title: document.getElementById('input-title') as HTMLInputElement,
        subtitle: document.getElementById('input-subtitle') as HTMLInputElement,
        address: document.getElementById('input-address') as HTMLTextAreaElement,
        validTill: document.getElementById('input-valid-till') as HTMLInputElement,
        blur: document.getElementById('input-blur') as HTMLInputElement,
    };

    if (!previewContainer) {
        console.error("Voucher preview container not found");
        return;
    }

    // PixiJS App
    const app = new PIXI.Application();
    
    // State
    let backgroundTexture: PIXI.Texture | null = null;
    let voucherCode = 'XXXXXX';

    async function initPixi() {
        await app.init({ 
            width: 800, 
            height: 450, 
            backgroundColor: 0xcccccc,
            preserveDrawingBuffer: true, // Important for download
            resolution: 3, // Set export resolution (3x = 2400x1350)
        });
        
        // Clear existing content and append canvas
        if (previewContainer) {
            previewContainer.innerHTML = '';
            previewContainer.appendChild(app.canvas);
            // Make canvas responsive
            app.canvas.style.width = '100%';
            app.canvas.style.height = 'auto';
        }

        // Load initial placeholder background
        try {
            backgroundTexture = await PIXI.Assets.load('https://placehold.co/800x450.png?text=Upload+Background');
            // Ensure texture is properly configured
            if (backgroundTexture) {
                backgroundTexture.source.alphaMode = 'no-premultiply';
            }
        } catch (e) {
            console.error("Failed to load placeholder", e);
        }

        render();
    }

    function render() {
        app.stage.removeChildren();

        const width = app.screen.width;
        const height = app.screen.height;

        // 0. Base Background
        const baseBg = new PIXI.Graphics();
        baseBg.rect(0, 0, width, height);
        baseBg.fill({ color: 0xcccccc });
        app.stage.addChild(baseBg);

        // 1. Background
        if (backgroundTexture) {
            const bgSprite = new PIXI.Sprite(backgroundTexture);
            bgSprite.anchor.set(0.5);
            bgSprite.x = width / 2;
            bgSprite.y = height / 2;

            // Cover logic
            const scale = Math.max(width / bgSprite.width, height / bgSprite.height);
            bgSprite.scale.set(scale);

            // Apply Blur
            const blurStrength = parseInt(inputs.blur.value, 10);
            if (blurStrength > 0) {
                const blurFilter = new PIXI.BlurFilter();
                blurFilter.strength = blurStrength;
                bgSprite.filters = [blurFilter];
            }
            
            app.stage.addChild(bgSprite);
        }

        // 2. Card Container
        const card = new PIXI.Container();
        
        // Card Background (Glass effect simulation)
        const cardBg = new PIXI.Graphics();
        const cardWidth = 500;
        const cardHeight = 350; // Approximate, will adjust based on content if needed
        
        cardBg.roundRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 20);
        cardBg.fill({ color: 0xffffff, alpha: 0.85 }); // Increased opacity for readability since we don't have backdrop blur easily
        cardBg.stroke({ width: 1, color: 0xffffff, alpha: 0.4 });
        
        card.addChild(cardBg);

        // Text Styles
        const titleStyle = new PIXI.TextStyle({
            fontFamily: 'Manrope',
            fontSize: 36,
            fontWeight: 'bold',
            fill: '#111827', // gray-900
            align: 'center',
            wordWrap: true,
            wordWrapWidth: cardWidth - 60
        });

        const subtitleStyle = new PIXI.TextStyle({
            fontFamily: 'Manrope',
            fontSize: 20,
            fontWeight: '500',
            fill: '#1f2937', // gray-800
            align: 'center',
            wordWrap: true,
            wordWrapWidth: cardWidth - 60
        });

        const addressStyle = new PIXI.TextStyle({
            fontFamily: 'Manrope',
            fontSize: 16,
            fill: '#1f2937', // gray-800
            align: 'center',
            wordWrap: true,
            wordWrapWidth: cardWidth - 60
        });

        const labelStyle = new PIXI.TextStyle({
            fontFamily: 'Manrope',
            fontSize: 14,
            fontWeight: '600',
            fill: '#374151', // gray-700
            align: 'center'
        });

        const codeStyle = new PIXI.TextStyle({
            fontFamily: 'monospace',
            fontSize: 12,
            fill: '#4b5563', // gray-600
            letterSpacing: 2,
            align: 'center'
        });

        // Content Layout
        let currentY = -cardHeight/2 + 40;

        // Title
        const titleText = new PIXI.Text({ text: inputs.title.value, style: titleStyle });
        titleText.anchor.set(0.5, 0);
        titleText.x = 0;
        titleText.y = currentY;
        card.addChild(titleText);
        currentY += titleText.height + 10;

        // Subtitle
        const subtitleText = new PIXI.Text({ text: inputs.subtitle.value, style: subtitleStyle });
        subtitleText.anchor.set(0.5, 0);
        subtitleText.x = 0;
        subtitleText.y = currentY;
        card.addChild(subtitleText);
        currentY += subtitleText.height + 20;

        // Divider
        const divider = new PIXI.Graphics();
        divider.moveTo(-100, 0);
        divider.lineTo(100, 0);
        divider.stroke({ width: 1, color: 0x1f2937, alpha: 0.2 });
        divider.y = currentY;
        card.addChild(divider);
        currentY += 20;

        // Address
        const addressText = new PIXI.Text({ text: inputs.address.value, style: addressStyle });
        addressText.anchor.set(0.5, 0);
        addressText.x = 0;
        addressText.y = currentY;
        card.addChild(addressText);
        currentY += addressText.height + 20;

        // Valid Till
        const validText = new PIXI.Text({ text: `Valid until: ${inputs.validTill.value}`, style: labelStyle });
        validText.anchor.set(0.5, 0);
        validText.x = 0;
        validText.y = currentY;
        card.addChild(validText);
        currentY += validText.height + 10;

        // Code
        const codeText = new PIXI.Text({ text: `Code: ${voucherCode}`, style: codeStyle });
        codeText.anchor.set(0.5, 0);
        codeText.x = 0;
        codeText.y = currentY;
        card.addChild(codeText);

        // Center Card
        card.x = width / 2;
        card.y = height / 2;
        app.stage.addChild(card);
    }

    // Event Listeners
    Object.values(inputs).forEach(input => {
        if (input) {
            input.addEventListener('input', render);
        }
    });

    if (bgUpload) {
        bgUpload.addEventListener('change', async (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files[0]) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    if (e.target?.result) {
                        backgroundTexture = await PIXI.Assets.load(e.target.result as string);
                        // Ensure texture is properly configured to prevent WebGL warnings
                        if (backgroundTexture) {
                            backgroundTexture.source.alphaMode = 'no-premultiply';
                        }
                        render();
                    }
                };
                reader.readAsDataURL(target.files[0]);
            }
        });
    }

    function generateCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    if (regenerateCodeBtn) {
        regenerateCodeBtn.addEventListener('click', () => {
            voucherCode = generateCode();
            render();
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            // Regenerate code if needed (optional, but keeping consistent with old logic)
            voucherCode = generateCode();
            render();

            // Wait for next frame to ensure render
            app.render();
            
            const link = document.createElement('a');
            link.download = `voucher_${voucherCode}.png`;
            link.href = (app.canvas as HTMLCanvasElement).toDataURL('image/png');
            link.click();
        });
    }

    // Initialize
    voucherCode = generateCode();
    initPixi();
}
