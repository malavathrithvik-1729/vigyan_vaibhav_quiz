/************************************************
 * ADMIN ANALYSIS
 ************************************************/

db.collection("atl_results").get()
  .then(snapshot => {
    let totalParticipants = snapshot.size;
    let totalScore = 0;
    let totalPossible = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      totalScore += data.score;
      totalPossible += data.total;
    });

    const avgScore =
      totalParticipants === 0 ? 0 : (totalScore / totalParticipants).toFixed(2);

    const avgPercentage =
      totalPossible === 0
        ? 0
        : ((totalScore / totalPossible) * 100).toFixed(2);

    document.getElementById("totalParticipants").innerText =
      totalParticipants;

    document.getElementById("averageScore").innerText =
      avgScore;

    document.getElementById("averagePercentage").innerText =
      avgPercentage + " %";
  })
  .catch(err => {
    console.error("Admin fetch error:", err);
    alert("Failed to load admin data");
  });
