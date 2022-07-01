        <script>
            const API_PATH = 'https://api.themoviedb.org/3';
            const API_KEY = 'ed6cc14023a74712f2b2ca3d7695bc00';

            // /qZMEiTsNlCQV27hHQE27ZtlPWyv.jpg

            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/original';
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w1280';
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w500';
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w300';

            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w1066_and_h600_bestv2'; // 2x, h
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w533_and_h300_bestv2'; // 1x, h
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w600_and_h900_bestv2'; // 2x, v
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w300_and_h450_bestv2'; // 1x, v
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w260_and_h390_bestv2'; // 2x, v
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w130_and_h195_bestv2'; // 1x, v
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w188_and_h282_bestv2'; // 2x, v
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w94_and_h141_bestv2'; // 1x, v

            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w710_and_h400_multi_faces'; // 2x, h
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w355_and_h200_multi_faces'; // 1x, h

            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w440_and_h660_face'; // 2x, v
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w220_and_h330_face'; // 1x, v
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w276_and_h350_face'; // 2x, v
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w138_and_h175_face'; // 1x, v
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w500_and_h282_face'; // 2x, h
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w250_and_h141_face'; // 1x, h
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w116_and_h174_face'; // 2x, v
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w58_and_h87_face'; // 1x, v
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w132_and_h132_face'; // 2x, s
            // const IMAGE_PATH = 'https://image.tmdb.org/t/p/w66_and_h66_face'; // 1x, s

            const RESULT_LIST = [];

            const makeURL = (des, ...param) => {
                let URL = `${API_PATH}${des}?api_key=${API_KEY}`;
                if (param)
                    URL += param
                        .map((item) => {
                            return item.indexOf('query') > -1
                                ? '&query=' +
                                      encodeURIComponent(item.substring(item.indexOf('=') + 1))
                                : '&' + item;
                        })
                        .join('');
                return URL;
            };

            const searchMovie = async (movie_name) => {
                const movieListResultProm = await fetch(
                    makeURL(
                        '/search/multi',
                        `query=${movie_name}`,
                        'language=ko',
                        'page=1',
                        'include_adult=true',
                        'region=true',
                        'append_to_response=videos,images,watch/providers'
                    )
                );
                const movieList = await movieListResultProm.json();
                const result1 = [...movieList.results];

                result1.forEach((item) => {
                    RESULT_LIST.push({
                        id: item.id,
                        media_type: item.media_type,
                        name: item.name || item.title,
                        release_date: item.release_date || item.first_air_date,
                        poster_path: item.poster_path,
                    });
                });

                console.log(result1);
                // RESULT_LIST = [];

                const responsePromises = await Promise.all(
                    result1.map((item) =>
                        fetch(
                            item.media_type === 'tv'
                                ? makeURL(
                                      `/tv/${item.id}`,
                                      'language=ko',
                                      'append_to_response=credits,watch/providers'
                                  )
                                : makeURL(
                                      `/movie/${item.id}`,
                                      'language=ko',
                                      'append_to_response=credits,watch/providers'
                                  )
                        )
                    )
                );

                const jsonPromises = await Promise.all(responsePromises.map((item) => item.json()));

                for (let response of jsonPromises) {
                    let lstIdx = RESULT_LIST.findIndex((item) => item.id === response.id);
                    RESULT_LIST[lstIdx].providers =
                        response['watch/providers']?.results['KR'] || null;
                    RESULT_LIST[lstIdx].credits = response['credits'] || null;
                }

                for (let movieItem of RESULT_LIST) {
                    const searchResult = document.querySelector('#search-result');
                    const newP = document.createElement('p');
                    const newImage = document.createElement('img');
                    newP.innerText = `${movieItem.name} / ${movieItem.id}`;
                    newImage.setAttribute('loading', 'lazy');
                    newImage.src = movieItem.poster_path
                        ? 'https://www.themoviedb.org/t/p/w94_and_h141_bestv2' +
                          movieItem.poster_path
                        : '';
                    searchResult.appendChild(newP);
                    searchResult.appendChild(newImage);

                    console.log(movieItem.providers);
                }

                console.log(RESULT_LIST);
            };

            searchMovie('그 해 우리는');
        </script>