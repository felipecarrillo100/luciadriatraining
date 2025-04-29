export const HxDRClient = {
    appHome: ()=>{
        const home = window.location.origin + window.location.pathname;
        return home.replace(/\/$/, "");
    },
    clientID: "2bqvf8rono37favklrk7hs39r1",
    congitoUrl: "https://hxdr-uat-dr-userpool-cgn.auth.eu-west-1.amazoncognito.com"
}
