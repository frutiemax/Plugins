

export function compressData(data){
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
	return compressed;
};

export function uncompressData(data){
	uncompressed = []

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
	return uncompressed;
};