import { saveTtsProviderSettings } from './index.js';

export { LingTtsProvider };

class LingTtsProvider {
    //########//
    // Config //
    //########//

    settings;
    ready = false;
    separator = '. ';

    characterList = {};
    voices = [];
    /**
     * Perform any text processing before passing to TTS engine.
     * @param {string} text Input text
     * @returns {string} Processed text
     */
    processText(text) {
        text = text.replace('<br>', '\n'); // Replace <br> with newline
        return text;
    }

    languageLabels = {
        '多语种混合': '多语种混合',
        '中文': '中文',
        '英文': '英文',
        '日文': '日文',
        '中英混合': '中英混合',
        '日英混合': '日英混合',
    };
    defaultSettings = {
        provider_endpoint: 'http://localhost:8062',

        language: '多语种混合',

        cha_name: '',
        character_emotion: 'default',

        speed: 1,

        top_k: 6,
        top_p: 0.85,
        temperature: 0.75,
        batch_size: 10,

        stream: false,
        stream_chunk_size: 100,
    };


    // 新增获取角色和情绪的方法
    async fetchCharacterList() {
        const response = await fetch(this.settings.provider_endpoint + '/character_list');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        const characterList = await response.json();
        this.characterList = characterList;
        this.voices = Object.keys(characterList);

    }



    get settingsHtml() {
        let html = `
        <label for="ling_api_language">Text Language</label>
        <select id="ling_api_language">`;

        for (let language in this.languageLabels) {
            if (this.languageLabels[language] == this.settings?.language) {
                html += `<option value="${this.languageLabels[language]}" selected="selected">${language}</option>`;
                continue;
            }

            html += `<option value="${this.languageLabels[language]}">${language}</option>`;
        }

        html += `
        </select>
        <label>ling Settings:</label><br/>
        <label for="ling_tts_endpoint">Provider Endpoint:</label>
        <input id="ling_tts_endpoint" type="text" class="text_pole" maxlength="250" value="${this.defaultSettings.provider_endpoint}"/>



        <div>Goto <a target="_blank" href="https://www.yuque.com/xter/zibxlp/knu8p82lb5ipufqy">API Document</a>.</div>

        <label for="ling_speed">Speed: <span id="ling_tts_speed_output">${this.defaultSettings.speed}</span></label>
        <input id="ling_speed" type="range" value="${this.defaultSettings.speed}" min="0.5" max="2" step="0.01" />

        <label for="ling_top_k">Top K: <span id="ling_top_k_output">${this.defaultSettings.top_k}</span></label>
        <input id="ling_top_k" type="range" value="${this.defaultSettings.top_k}" min="0" max="100" step="1" />

        <label for="ling_top_p">Top P: <span id="ling_top_p_output">${this.defaultSettings.top_p}</span></label>
        <input id="ling_top_p" type="range" value="${this.defaultSettings.top_p}" min="0" max="1" step="0.01" />

        <label for="ling_temperature">Temperature: <span id="ling_tts_temperature_output">${this.defaultSettings.temperature}</span></label>
        <input id="ling_temperature" type="range" value="${this.defaultSettings.temperature}" min="0.01" max="1" step="0.01" />

        <label for="ling_batch_size">Batch Size: <span id="ling_batch_size_output">${this.defaultSettings.batch_size}</span></label>
        <input id="ling_batch_size" type="range" value="${this.defaultSettings.batch_size}" min="1" max="35" step="1" />

        <label for="ling_tts_streaming" class="checkbox_label">
            <input id="ling_tts_streaming" type="checkbox" ${this.defaultSettings.stream ? 'checked' : ''}/>
            <span>Streaming</span>
        </label>

        <label for="ling_stream_chunk_size">Stream Chunk Size: <span id="ling_stream_chunk_size_output">${this.defaultSettings.stream_chunk_size}</span></label>
        <input id="ling_stream_chunk_size" type="range" value="${this.defaultSettings.stream_chunk_size}" min="100" max="400" step="1" />
        <title>About ling (GPT-Sovits Inference)</title>
        <p>
        ling (GPT-Sovits Inference) is an inference enhancement project based on
            <a href="https://github.com/RVC-Boss/GPT-SoVITS" target="_blank">GPT-Sovits</a>, allowing you to run an API interface locally, offering emotion-rich speech-to-text and convenient model management features.
        </p>
        <p>
            For more information, visit the
            <a href="https://github.com/X-T-E-R/GPT-SoVITS-Inference" target="_blank">ling project page</a>.
        </p>
        `;

        return html;
    }

    onSettingsChange() {
        // Update provider settings based on input fields
        this.settings.provider_endpoint = $('#ling_tts_endpoint').val();
        this.settings.language = $('#ling_api_language').val();


        // Update the rest of TTS settings based on input fields
        this.settings.speed = parseFloat($('#ling_speed').val());
        this.settings.temperature = parseFloat($('#ling_temperature').val());
        this.settings.top_k = parseInt($('#ling_top_k').val(), 10);
        this.settings.top_p = parseFloat($('#ling_top_p').val());
        this.settings.batch_size = parseInt($('#ling_batch_size').val(), 10);
        this.settings.stream = $('#ling_tts_streaming').is(':checked');
        this.settings.stream_chunk_size = parseInt($('#ling_stream_chunk_size').val(), 10);

        // Update UI to reflect changes

        $('#ling_tts_speed_output').text(this.settings.speed);
        $('#ling_tts_temperature_output').text(this.settings.temperature);
        $('#ling_top_k_output').text(this.settings.top_k);
        $('#ling_top_p_output').text(this.settings.top_p);
        $('#ling_stream_chunk_size_output').text(this.settings.stream_chunk_size);
        $('#ling_batch_size_output').text(this.settings.batch_size);




        // Persist settings changes
        saveTtsProviderSettings();

    }

    async loadSettings(settings) {
        // Populate Provider UI given input settings
        if (Object.keys(settings).length === 0) {
            console.info('Using default TTS Provider settings');
        }

        // Only accept keys defined in defaultSettings
        this.settings = { ...this.defaultSettings, ...settings };

        // Fetch character and emotion list
        // Set initial values from the settings
        $('#ling_tts_endpoint').val(this.settings.provider_endpoint);
        $('#ling_api_language').val(this.settings.language);

        $('#ling_speed').val(this.settings.speed);
        $('#ling_temperature').val(this.settings.temperature);
        $('#ling_top_k').val(this.settings.top_k);
        $('#ling_top_p').val(this.settings.top_p);
        $('#ling_batch_size').val(this.settings.batch_size);
        $('#ling_tts_streaming').prop('checked', this.settings.stream);
        $('#ling_stream_chunk_size').val(this.settings.stream_chunk_size);

        // Update UI to reflect initial settings
        $('#ling_tts_speed_output').text(this.settings.speed);
        $('#ling_tts_temperature_output').text(this.settings.temperature);
        $('#ling_top_k_output').text(this.settings.top_k);
        $('#ling_top_p_output').text(this.settings.top_p);
        $('#ling_stream_chunk_size_output').text(this.settings.stream_chunk_size);

        // Register event listeners to update settings on user interaction
        // (Similar to before, ensure event listeners for character and emotion selection are included)
        // Register input/change event listeners to update settings on user interaction
        $('#ling_tts_endpoint').on('input', () => { this.onSettingsChange(); });
        $('#ling_api_language').on('change', () => { this.onSettingsChange(); });

        $('#ling_speed').on('input', () => { this.onSettingsChange(); });
        $('#ling_temperature').on('input', () => { this.onSettingsChange(); });
        $('#ling_top_k').on('input', () => { this.onSettingsChange(); });
        $('#ling_top_p').on('input', () => { this.onSettingsChange(); });
        $('#ling_batch_size').on('input', () => { this.onSettingsChange(); });
        $('#ling_tts_streaming').on('change', () => { this.onSettingsChange(); });
        $('#ling_stream_chunk_size').on('input', () => { this.onSettingsChange(); });

        await this.checkReady();
        console.debug('ling: Settings loaded');
    }



    // Perform a simple readiness check by trying to fetch voiceIds
    async checkReady() {
        await Promise.allSettled([this.fetchCharacterList()]);
    }

    async onRefreshClick() {
        return;
    }

    //#################//
    //  TTS Interfaces //
    //#################//

    async getVoice(voiceName) {
        if (this.voices.length == 0) {
            this.fetchCharacterList();
        }
        if (!this.voices.includes(voiceName)) {
            throw `TTS Voice name ${voiceName} not found`;
        }
        return { name: voiceName, voice_id: voiceName, preview_url: false, lang: 'zh-CN' };
    }

    async generateTts(text, voiceId) {
        const response = await this.fetchTtsGeneration(text, voiceId);
        return response;
    }

    //###########//
    // API CALLS //
    //###########//
    async fetchTtsVoiceObjects() {
        if (this.voices.length == 0) {
            await this.fetchCharacterList();
        }
        console.log(this.voices);
        const voices = this.voices.map(x => ({ name: x, voice_id: x, preview_url: false, lang: 'zh-CN' }));
        return voices;
    }


    async fetchTtsGeneration(inputText, voiceId) {
        console.info(`Generating new TTS for voice_id ${voiceId}`);


        const params = new URLSearchParams();
        params.append('text', inputText);
        params.append('cha_name', voiceId);
        params.append('text_language', this.settings.language);
        params.append('batch_size', this.settings.batch_size.toString());
        params.append('speed', this.settings.speed.toString());
        params.append('top_k', this.settings.top_k.toString());
        params.append('top_p', this.settings.top_p.toString());
        params.append('temperature', this.settings.temperature.toString());
        params.append('stream', this.settings.stream.toString());


        return `${this.settings.provider_endpoint}/tts?${params.toString()}`;

    }

    // Interface not used by ling TTS
    async fetchTtsFromHistory(history_item_id) {
        return Promise.resolve(history_item_id);
    }

}
