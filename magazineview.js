<script src="//mozilla.github.io/pdf.js/build/pdf.mjs" type="module"></script>

<script type="module">
    var url = 'YOUR_URL';
    var { pdfjsLib } = globalThis;
    pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.mjs';

    var pdfDoc = null,
        pageNum = 1,
        pageRendering = false,
        pageNumPending = null,
        scale = 2, 
        canvas1 = document.getElementById('the-canvas-1'),
        ctx1 = canvas1.getContext('2d'),
        canvas2 = document.getElementById('the-canvas-2'),
        ctx2 = canvas2.getContext('2d');

    function renderPage(num, canvas, ctx) {
        pageRendering = true;
        clearAnnotations(canvas);
        pdfDoc.getPage(num).then(function (page) {
            var viewport = page.getViewport({ scale: scale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.height = 'auto';  
            canvas.style.width = '100%';

            var renderContext = {
                canvasContext: ctx,
                viewport: viewport,
            };
            var renderTask = page.render(renderContext);

            renderTask.promise.then(function () {
                return page.getAnnotations();
            }).then(function (annotations) {
                renderAnnotations(annotations, viewport, canvas);
                pageRendering = false;
                if (pageNumPending !== null) {
                    renderPage(pageNumPending, canvas, ctx);
                    pageNumPending = null;
                }
            });
        });
    }

    function renderAnnotations(annotations, viewport, canvas) {
        const canvasContainer = canvas.parentNode;
        const displayWidth = canvas.offsetWidth;
        const displayHeight = canvas.offsetHeight;
        const scaleX = displayWidth / canvas.width;
        const scaleY = displayHeight / canvas.height;

        annotations.forEach(function (annotation) {
            if (annotation.subtype === 'Link' && annotation.url) {
                const link = document.createElement('a');
                link.href = annotation.url;
                link.style.position = 'absolute';
                link.style.textDecoration = 'underline';
                //link.style.border = "1px red solid"; //if you wish to test if links are in the correct space

                const rect = viewport.convertToViewportRectangle(annotation.rect);
                const left = Math.min(rect[0], rect[2]) * scaleX;
                const top = Math.min(rect[1], rect[3]) * scaleY;
                const width = Math.abs(rect[2] - rect[0]) * scaleX;
                const height = Math.abs(rect[3] - rect[1]) * scaleY;

                link.style.left = `${left}px`;
                link.style.top = `${top}px`;
                link.style.width = `${width}px`;
                link.style.height = `${height}px`;

                canvasContainer.appendChild(link);
            }
        });
    }

    function clearAnnotations(canvas) {
        const canvasContainer = canvas.parentNode;
        const links = canvasContainer.querySelectorAll('a');
        links.forEach(link => link.remove());
    }

    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num, canvas1, ctx1);
            if (num < pdfDoc.numPages) {
                renderPage(num + 1, canvas2, ctx2);
            }
            updatePageNum();
        }
    }

    function updatePageNum() {
        document.getElementById('page_num').textContent = pageNum + ' - ' + (pageNum + 1);
    }

    function onPrevPage() {
        if (pageNum <= 1) {
            return;
        }
        pageNum -= 2;
        queueRenderPage(pageNum);
    }

    document.getElementById('prev').addEventListener('click', onPrevPage);

    function onNextPage() {
        if (pageNum >= pdfDoc.numPages - 1) {
            return;
        }
        pageNum += 2;
        queueRenderPage(pageNum);
    }

    document.getElementById('next').addEventListener('click', onNextPage);

    pdfjsLib.getDocument(url).promise.then(function (pdfDoc_) {
        pdfDoc = pdfDoc_;
        document.getElementById('page_count').textContent = pdfDoc.numPages;
        queueRenderPage(pageNum);
    });
</script>

<div style="display: flex; justify-content: space-between;">
    <div style="position: relative;">
        <canvas id="the-canvas-1" style="width: 100%;"></canvas>
    </div>
    <div style="position: relative;">
        <canvas id="the-canvas-2" style="width: 100%;"></canvas>
    </div>
</div>

<div style="padding: 10px; border-radius: 10px; text-align: center;">
    <button id="prev" style="border-radius: 50px; background-color: #8ae6fc; color: #000000; border: none; height:50px; width:50px; font-size: 16px; cursor: pointer;">
        &larr;
    </button>
    <button id="next" style="border-radius: 50px; background-color: #8ae6fc; color: #000000; border: none; height:50px; width:50px; font-size: 16px; cursor: pointer;">
        &rarr;
    </button>
    <br>
    <span style="margin: 0 20px;"> <span id="page_num"></span>/<span id="page_count"></span></span>
</div>
