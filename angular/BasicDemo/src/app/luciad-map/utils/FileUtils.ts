class FileUtils {
    private MyPrivateClipboard : string;

    constructor() {
        this.MyPrivateClipboard = "";
    }

    public getFilenameExtension(filename: string) {
//        return filename.substring(filename.lastIndexOf('.')+1, filename.length) || filename;
        return filename.slice((Math.max(0, filename.lastIndexOf(".")) || Infinity) + 1);
    }

    public parseUrl(url: string) {
        const parser = document.createElement('a');
        parser.href = url.trim();
        const path = parser.pathname.substring(0, parser.pathname.lastIndexOf("/"));
       // const filename = parser.pathname.replace(/^.*[\\\/]/, '')
        const filename = parser.pathname.replace(/^.*[\\/]/, '')

        const result = {
            protocol: parser.protocol, // => "http:"
            host: parser.host,     // => "example.com:3000"
            hostname: parser.hostname, // => "example.com"
            port: parser.port,     // => "3000"
            pathname: parser.pathname, // => "/pathname/"
            path,
            filename,
            hash: parser.hash,     // => "#hash"
            search: parser.search,   // => "?search=test"
            origin: parser.origin,   // => "http://example.com:3000"
        }
        return result;
    }

    public download(data:string, filename:string, type: string, defaultExtension?:string) {
        if (defaultExtension) {
            const currentExtension = this.getFilenameExtension(filename);
            if (currentExtension!==defaultExtension) {
                filename = filename + "." + defaultExtension;
            }
        }
        const file = new Blob([data], {type});
        // @ts-ignore
        if (window.navigator.msSaveOrOpenBlob) {// IE10+
            // @ts-ignore
            window.navigator.msSaveOrOpenBlob(file, filename);
        }
        else { // Others
            const a = document.createElement("a");
            const url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() =>{
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }

    public downloadURL(url:string, filename:string, defaultExtension?:string) {
        if (defaultExtension) {
            const currentExtension = this.getFilenameExtension(filename);
            if (currentExtension!==defaultExtension) {
                filename = filename + "." + defaultExtension;
            }
        }
        const a = document.createElement("a");
        a.href = url;
        a.setAttribute("target", "_blank");
        a.download = filename;
        document.body.appendChild(a);
        // do not perform download during automation tests
        if (!(window as any).Cypress) {
            a.click();
        }
        setTimeout(() =>{
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }

    public getTextFromClipboard() {
        return new Promise((resolve, reject) => {
            const WINDOW = navigator as any;
            if(WINDOW && WINDOW.clipboard&& WINDOW.clipboard.readText) {
                const whenText = WINDOW.clipboard.readText();
                whenText.then((text:any)=>{
                    resolve(text);
                }, (e:any)=>{
                    resolve(this.MyPrivateClipboard);
                });
            } else {
                resolve(this.MyPrivateClipboard);
            }
        })
    }

    public copyTextToClipboard(text: string, onSuccess?:any, onFailure?:any) {
        function fallbackCopyTextToClipboard (t: string) {
            const textArea = document.createElement("textarea");
            textArea.value = t;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                const msg = successful ? 'successful' : 'unsuccessful';
                const message =  'Copying text command was ' + msg;
                // tslint:disable-next-line:no-console
                console.log('Fallback: ' + message);
                if (onSuccess) {
                    onSuccess(message);
                }
            } catch (err) {
                const message = 'Oops, unable to copy: ' + err;
                // tslint:disable-next-line:no-console
                console.error('Fallback: ', message);
                if (onFailure) {
                    onFailure(message);
                }
            }
            document.body.removeChild(textArea);
        }
        // main
        this.MyPrivateClipboard = text;
        const nav = navigator as any;
        if (!nav.clipboard) {
            fallbackCopyTextToClipboard(text);
            return;
        }
        nav.clipboard.writeText(text).then(() => {
            const message = "Copying to clipboard was successful!";
            // tslint:disable-next-line:no-console
            console.log('Async: ' + message);
            if (onSuccess) {
                onSuccess(message);
            }
            }, (err: any) => {
            const message = "Could not copy text: " + err;
            // tslint:disable-next-line:no-console
            console.error('Async: '+ message);
            if (onFailure) {
                onFailure(message);
            }
        });
    }

    public getBaseUrl(url: string) {
        if (url===null) return "";
        let baseURL = url.trim();
        const index = baseURL.indexOf('?');
        if (index >= 0) {
            baseURL = url.substring(0, index);
        }
        return baseURL;
    }

    public doesURLExists(url: string) {
        const http = new XMLHttpRequest();
        return new Promise<boolean>((resolve, reject) => {
            http.open('HEAD', url);
            http.onreadystatechange = function() {
                if (this.readyState === this.DONE) {
                    resolve(this.status !== 404);
                }
            };
            http.send();
        })
    }

    public mobilecheck() {
        const win = window as any;
        let check = false;
        ( (a) => {
            // eslint-disable-next-line no-useless-escape
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) {
                check = true;
            }
        })(navigator.userAgent || navigator.vendor || win.opera);
        return check;
    }

    public absolutePath(href: string) {
        const link = document.createElement("a");
        link.href = href;
        return (link.protocol+"//"+link.host+link.pathname+link.search+link.hash);
    }
}

export default new FileUtils();
