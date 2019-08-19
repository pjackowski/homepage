"use strict";

function getRandomWords(words, length) {
    const zeroArr= new Uint32Array(length);
    const randomArr= window.crypto.getRandomValues(zeroArr);
    const randomWordsArr= Array.prototype.map.call(randomArr, function(e) {
            return words[e % words.length];
        });

    return randomWordsArr;
}

function getFormattedPassphrase(words, length, padding) {
    const passphraseArr= getRandomWords(words, length);
    const formattedPassphraseArr= passphraseArr.map(function(e) {
            return e.padEnd(padding);
        });
    const formattedPassphraseStr= formattedPassphraseArr.join(' ');

    return formattedPassphraseStr;
}

fetch('corncob-lowercase.txt')
    .then(function(response) {
        return response.text();
    })
    .then(function(data) {
        const candidatesNum= 20;
        const lengthNum= 6;
        const paddingNum= 18;

        let dictionaryArr= data.split('\n');
        dictionaryArr.pop();

        let passphrasesStr= '';
        let entropyStr= '';

        for (let i= 0; i< candidatesNum; i++) {
            passphrasesStr+= getFormattedPassphrase(dictionaryArr, lengthNum, paddingNum) + '\n';
        }

        for (let i= 1; i<= 8; i++) {
            entropyStr+= `${i} words  ${(Math.log2(dictionaryArr.length) * i).toFixed(1)} bits\n`;
        }

        document.getElementById('passwords').textContent+= passphrasesStr;
        document.getElementById('entropy').textContent+= entropyStr;
    });
