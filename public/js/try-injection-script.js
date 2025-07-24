document.addEventListener('DOMContentLoaded', () => {
    const targetUrlInput = document.getElementById('targetUrl');
    const testTypeSelect = document.getElementById('testType');
    const submitButton = document.getElementById('submitBtn');
    const resultDisplayDiv = document.getElementById('resultDisplay');

    // Payload creator elements
    const payloadNameInput = document.getElementById('payloadName');
    const payloadTypeSelect = document.getElementById('payloadType');
    const payloadValueInput = document.getElementById('payloadValue');
    const payloadDescriptionInput = document.getElementById('payloadDescription');
    const savePayloadBtn = document.getElementById('savePayloadBtn');
    const payloadSaveResult = document.getElementById('payloadSaveResult');

    const payloads = {
        'html': '<h1>HTML Injected!</h1><p style="color:red;">This text was added!</p>',
        'xss': '<script>alert("XSS from Project Injection!");</script>',
        'sql': "' OR 1=1; --",
        'other': 'This is a generic test payload for other vulnerabilities.'
    };

    // Test payload functionality
    if (submitButton && targetUrlInput && testTypeSelect && resultDisplayDiv) {
        submitButton.addEventListener('click', async () => {
            const targetUrl = targetUrlInput.value.trim();
            const testType = testTypeSelect.value;
            const payload = payloads[testType];

            if (!targetUrl) {
                resultDisplayDiv.innerHTML = '<p style="color: red;">Please provide a Target URL.</p>';
                return;
            }

            resultDisplayDiv.innerHTML = '<p style="color: #00BCD4;">Testing payload...</p>';

            try {
                let response;
                let data;
                let fullUrl;

                switch (testType) {
                    case 'html':
                    case 'xss':
                        fullUrl = `${targetUrl}/submit-comment-vulnerable`;
                        response = await fetch(fullUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ comment: payload }),
                        });
                        data = await response.json();
                        break;

                    case 'sql':
                        fullUrl = `${targetUrl}/search-user-vulnerable?username=${encodeURIComponent(payload)}`;
                        response = await fetch(fullUrl);
                        data = await response.json();
                        break;

                    case 'other':
                        fullUrl = `${targetUrl}/generic-payload-test`;
                        response = await fetch(fullUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ payload: payload, type: 'other' }),
                        });
                        data = await response.json();
                        break;
                }

                if (response.ok && data.success) {
                    resultDisplayDiv.innerHTML = `<p style="color: green; font-size: 18px;">${payload} ✅</p>`;
                } else {
                    resultDisplayDiv.innerHTML = '<p style="color: red; font-size: 18px;">Not possible</p>';
                }

            } catch (error) {
                resultDisplayDiv.innerHTML = '<p style="color: red; font-size: 18px;">Not possible</p>';
            }
        });
    }

    // Save payload functionality
    if (savePayloadBtn && payloadNameInput && payloadTypeSelect && payloadValueInput && payloadSaveResult) {
        savePayloadBtn.addEventListener('click', async () => {
            const name = payloadNameInput.value.trim();
            const type = payloadTypeSelect.value;
            const payload = payloadValueInput.value.trim();
            const description = payloadDescriptionInput.value.trim();

            if (!name || !payload) {
                payloadSaveResult.innerHTML = '<p style="color: red;">Name and Payload Code are required.</p>';
                return;
            }

            payloadSaveResult.innerHTML = '<p style="color: #00BCD4;">Saving payload...</p>';

            try {
                const response = await fetch('http://localhost:3000/api/save-payload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name,
                        type: type,
                        payload: payload,
                        description: description
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    payloadSaveResult.innerHTML = '<p style="color: green; font-size: 16px;">Payload saved successfully! ✅</p>';
                    // Clear form
                    payloadNameInput.value = '';
                    payloadValueInput.value = '';
                    payloadDescriptionInput.value = '';
                } else {
                    payloadSaveResult.innerHTML = `<p style="color: red;">Failed to save: ${data.message}</p>`;
                }

            } catch (error) {
                payloadSaveResult.innerHTML = '<p style="color: red;">Error saving payload. Check if backend is running.</p>';
            }
        });
    }
});
