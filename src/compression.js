

export function compressData(data){
	console.log("before compression length = " + data.length);
	compressed = []

	count = 0;
	token = data[0];

	//push the first token to know where to start of
	compressed.push(token);
	for(i = 1; i < data.length; i++){
		if(data[i] != token){
			compressed.push(count);
			count = 1;
			token = !token;
		}
		else{
			count++;
		}
	}
	compressed.push(count);
	console.log("after compression length = " + compressed.length);
	return compressed;
};

export function uncompressData(data){
	uncompressed = []
	console.log("before decompression length = " + data.length);

	//get the first token
	token = data[0]
	uncompressed.push(token);

	for(i = 1; i < data.length; i++){
		count = data[i];

		for(j = 0; j < count; j++){
			uncompressed.push(token);
		}

		token = !token;
	}
	console.log("after decompression length = " + uncompressed.length);
	return uncompressed;
};