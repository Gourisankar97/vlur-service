const { GameMap } = require("../Game/game");

exports.generate = () =>{
        const ONE = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
        const TWO = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
        const THREE = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
        const FOUR = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
        const FIVE = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
        const SIX = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
        const SEVEN = [0,1,2,3,4,5,6,7,8,9];


        var token = '';
        

        for(let i = 0; i<10; i++) {
            let pick = Math.floor(Math.random() * 10);
            switch (pick) {
                case 0:
                    let index1 = Math.floor(Math.random() * 26);
                    token += ONE[index1];
                    break;
                case 1:
                    let index2 = Math.floor(Math.random() * 26);
                    token += TWO[index2];
                    break;
                case 2:
                    let index3 = Math.floor(Math.random() * 26);
                    token += THREE[index3];
                    break;
                case 3:
                    let index4 = Math.floor(Math.random() * 26);
                    token += FOUR[index4];
                    break;
                case 4:
                    let index5 = Math.floor(Math.random() * 26);
                    token += FIVE[index5];
                    break;
                case 5:
                    let index6 = Math.floor(Math.random() * 26);
                    token += SIX[index6];
                    break;
                case 6:
                    let index7 = Math.floor(Math.random() * 10);
                    token += SEVEN[index7];
                    break;
                case 7:
                    let index8 = Math.floor(Math.random() * 26);
                    token += ONE[index8];
                    break; 
                case 8:
                    let index9 = Math.floor(Math.random() * 26);
                    token += FOUR[index9];
                    break;
                case 9:
                    let index10 = Math.floor(Math.random() * 26);
                    token += TWO[index10];
                    break;
            }
        }

        if(!GameMap.has(token)) {
            return token;
        }
        else {
            return this.generate();
        }

        
}
