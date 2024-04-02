module.exports = class SSEController {
    constructor() {
        this.cancelStreaming = false;
    }

    subscribe(req, res) {
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        };

        res.writeHead(200, headers);

        this._changeData(res, 1, 10);
    };

    unsubscribe(res) {
        this.cancelStreaming = true;

        res.send(`<html><body>Streaming is cancelled.</body></html>`);
    }

    _changeData(res, id, count) {
        if (this.cancelStreaming) {
            res.end();
            this.cancelStreaming = false;
            return;
        }

        console.log('[sse] changeData', { id });

        res.write(`id: ${id}\n`);
        res.write('event: message\n');
        res.write(`data: ${this._generateNumber()}\n\n`);
        if (count > 1) {
            const timer = setTimeout(() => {
                this._changeData(res, id + 1, count - 1);
                clearTimeout(timer);
            }, 1000);
        } else {
            res.write(`id: N/A\n`);
            res.write('event: message\n');
            res.write(`data: finished\n\n`);
            res.end();
        };
    }

    _generateNumber() {
        const min = 10;
        const max = 99;

        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};