
# Slidedeck 1
mkdir -p visual-programming-frames
PDF1="visual-programming.pdf"
# Extract slides 1 and 2 in a folder called visual-programming-frames/{0,1}.svg
for i in {1..2}; do
    pdf2svg ${PDF1} visual-programming-frames/$((i)).svg $i
done


mkdir -p escher-iterations-frames
PDF2="escher-iterations.pdf"
# Extract slides 1 and 2 in a folder called escher-iterations-frames/{0,1}.svg
for i in {1..14}; do
    pdf2svg ${PDF2} escher-iterations-frames/$((i)).svg $i
done



mkdir -p escher-qualitative-results-frames
PDF3="escher-qualitative-results.pdf"
# Extract slides 1 and 2 in a folder called escher-qualitative-results-frames/{0,1}.svg
for i in {1..5}; do
    pdf2svg ${PDF3} escher-qualitative-results-frames/$((i)).svg $i
done