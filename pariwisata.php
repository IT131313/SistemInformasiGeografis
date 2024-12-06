<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA_Compatible" content="IE-edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h2>Pariwisata</h2>
    
    <?php
    $connection = pg_connect("host=localhost dbname=Pariwisata user=postgres password=alfath2602");
    if (!$connection) {
        echo "An error occured.<br>";
        exit;
    }

    $result = pg_query($connection, "SELECT * FROM pariwisata_lampung");
    if (!$result) {
        echo "An error occured.<br>";
        exit;
    }
    ?>

    <table>
        <tr>
            <th>gid</th>
            <th>objectid</th>
            <th>no_</th>
            <th>nama_objek</th>
            <th>jenis_obje</th>
            <th>koordinat</th>
            <th>y1</th>
            <th>y2</th>
            <th>y3</th>
            <th>y</th>
            <th>x1</th>
            <th>x2</th>
            <th>x3</th>
            <th>x</th>
            <th>alamat</th>
            <th>deskripsi</th>
            <th>geom</th>
        </tr>

        <?php
        while($row = pg_fetch_assoc($result)) {
            echo "
            <tr>
                <td>$row[gid]</td>
                <td>$row[objectid]</td>
                <td>$row[no_]</td>
                <td>$row[nama_objek]</td>
                <td>$row[jenis_obje]</td>
                <td>$row[koordinat]</td>
                <td>$row[y1]</td>
                <td>$row[y2]</td>
                <td>$row[y3]</td>
                <td>$row[y]</td>
                <td>$row[x1]</td>
                <td>$row[x2]</td>
                <td>$row[x3]</td>
                <td>$row[x]</td>
                <td>$row[alamat]</td>
                <td>$row[deskripsi]</td>
                <td>$row[geom]</td>
            </tr>
            ";
        }
        ?>
    </table>


</body>
</html>
