
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const conversionList = document.getElementById('conversion-list');
    const convertBtn = document.getElementById('convert-btn');
    const downloadAllBtn = document.getElementById('download-all');
    const resultsContainer = document.getElementById('conversion-results');
    
    let files = [];
    
    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    function handleFiles(fileList) {
        const newFiles = Array.from(fileList).filter(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            return ['docx', 'xlsx', 'pptx', 'pdf'].includes(ext);
        });
        
        files = [...files, ...newFiles];
        updateFilesList();
        updateButtons();
    }
    
    function updateFilesList() {
        conversionList.innerHTML = files.map((file, index) => `
            <div class="file-item">
                <i class="fas fa-file file-icon"></i>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
                <button class="remove-btn" onclick="removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    function updateButtons() {
        convertBtn.disabled = files.length === 0;
        downloadAllBtn.disabled = !document.querySelector('.result-item');
    }
    
    window.removeFile = (index) => {
        files.splice(index, 1);
        updateFilesList();
        updateButtons();
    };
    
    convertBtn.addEventListener('click', async () => {
        convertBtn.disabled = true;
        convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
        
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        
        try {
            const response = await fetch('/convert', {
                method: 'POST',
                body: formData
            });
            
            const results = await response.json();
            displayResults(results);
        } catch (error) {
            alert('Error converting files. Please try again.');
        } finally {
            convertBtn.disabled = false;
            convertBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Convert Files';
            updateButtons();
        }
    });
    
    function displayResults(results) {
        resultsContainer.innerHTML = results.map(result => `
            <div class="result-item">
                <div class="result-header">
                    <h3>${result.filename}</h3>
                    <span class="status ${result.success ? 'success' : 'error'}">
                        ${result.success ? 'Converted' : 'Failed'}
                    </span>
                </div>
                ${result.success ? `
                    <div class="result-content">${escapeHtml(result.content.slice(0, 200))}...</div>
                    <div class="result-actions">
                        <button class="copy-btn" onclick="copyContent('${result.id}')">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <button class="download-btn" onclick="downloadResult('${result.id}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                ` : `
                    <div class="error-message">${result.error}</div>
                `}
            </div>
        `).join('');
    }
    
    window.copyContent = async (resultId) => {
        const content = document.querySelector(`#result-${resultId} .result-content`).textContent;
        await navigator.clipboard.writeText(content);
        
        const copyBtn = document.querySelector(`#result-${resultId} .copy-btn`);
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        }, 2000);
    };
    
    window.downloadResult = (resultId) => {
        const content = document.querySelector(`#result-${resultId} .result-content`).textContent;
        const filename = document.querySelector(`#result-${resultId} h3`).textContent;
        
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.replace(/\.[^/.]+$/, '.md');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
